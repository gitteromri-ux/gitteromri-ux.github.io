# Employee Rank & Allocation Analysis

**Data window:** 2024-01-01 → 2026-05-06
**Source:** `vw_kpi_employee_rank` (built on `fact_EmployeesRank_NewLogic`) — 41,779 rows, 144 reps, 5 segments, 10 languages.
**Rank convention used in this analysis: R1 = weakest, R4 = strongest** (per the model definition).

> Throughout this report, **SOV** refers to `StatSOVCRM` from the view (the most complete revenue field). `ActualStatCRMCourseSOV` is similar but ~1% smaller; both lead to the same conclusions. `Orders` = registrations. `Acquisitions` = first-time orders. `Calls` = call-center call counts. `Contacted` = quality-lead contacts.

---

## A. Executive summary (10 key insights)

1. **The rank logic generally works in 3 of 5 segments.** In Biblical Related, Hebrew Related, and Popular Languages, SOV/call rises **monotonically** from R1 → R4, exactly as designed.
2. **The rank logic is broken in Coding** for `RankRegFromCalls`: R4 produces *less* SOV per contact ($67.4) than R1 ($85.7) and R3 ($88.4). R3 is actually the best rank in this segment.
3. **The rank logic is mostly correct in Langaroo, but the sample is too small to trust** — only ~1,000 calls and 111 contacted customers across the entire segment.
4. **R4 is consistently under-allocated calls.** In Biblical Related R4 takes 25% of calls but generates 42% of SOV. In Hebrew Related: 26% of calls → 41% of SOV. In Popular Languages: 28% of calls → 52% of SOV. **R4 should receive more call volume.**
5. **R1 and R2 are over-allocated calls in every segment with reliable data.** Biblical R1+R2 take 49% of calls but produce only 32% of SOV. Hebrew R1+R2 take 47% of calls but produce 31% of SOV. Popular Languages R1+R2 take 48% of calls but produce 25% of SOV.
6. **The rank reflects efficiency, not revenue.** A rep can be R4 because their orders/calls ratio is high, even if the average SOV per order is low. Always cross-check with $/call and $/contact on the dashboard.
7. **Calls per contact differ wildly by rank** (R1 ≈ 21 calls/contact, R4 ≈ 10–11 calls/contact). R4 reps are more efficient at converting a contact in fewer calls — this is a key driver of the per-call lift.
8. **Acquisitions follow the same rank order as orders** in every segment with enough volume, so a single ranking system is sufficient — no need to re-rank by acquisitions separately.
9. **High-potential reps exist below the median call volume in every segment** (35+ candidates flagged on the dashboard's *Optimization* tab). Giving them more volume is the largest immediate upside.
10. **Free, professional, public, no-Perplexity-branding dashboard solution = GitHub Pages.** Step-by-step setup is provided in section I.

---

## B. How the rank logic works (plain-English version of the SQL)

### `vw_kpi_employee_rank`
The view UNIONs five fact tables — `fact_Leads` (contacts), `fact_Acquisitions`, `fact_Orders`, `fact_SAP` (upsales), and `fact_CallCenterCalls` — at the day × semester × language × employee grain, aggregates them to one weekly **RankDate** (every Sunday), and joins the rank that the employee held on that Sunday from `HelpDB.PowerBI.fact_EmployeesRank_NewLogic`.

Two ranks are attached to every row:

- **RankRegFromContacted** — quartile rank by *registrations / contacted customers* in the segment.
- **RankRegFromCalls** — quartile rank by *registrations / calls* in the segment.

`-1` means the rep had zero contacted (or zero calls) that week. `NULL` means the rep was not present in `fact_EmployeesRank` at all that Sunday (typically not in Sales / New team). I treated both as **unranked** in the analysis.

### `fact_EmployeesRank_NewLogic` — how the quartile is assigned

For every Sunday from 2023-12-31 onward, the procedure:

1. Sums `Contacted` (from quality leads), `Reg` (orders), and `Calls` per Employee × Category × Language **over the previous 10 weeks**.
2. Computes two efficiency ratios:
   - `RegFromContacted = Reg / Contacted`
   - `RegFromCalls = Reg / Calls`
3. Within each (Date, Category, Language) group, sorts employees by the ratio (ties broken by `NumOfReg`, then `EmployeeID`) and runs a **volume-weighted cumulative quartile**:
   - Position = `(CumulativeContacted − NumOfContacted/2) / TotalContactedInGroup`
   - Position ≤ 0.25 → **R1**, ≤ 0.50 → **R2**, ≤ 0.75 → **R3**, > 0.75 → **R4**.

**Important:** the cut is made on cumulative *volume*, not on cumulative *number of reps*. A rep handling tiny volume that happens to fall in the top 25% slice of contacted volume can land in R4 with very few calls behind them — a sample-size trap.

### What the rank rewards and where it can mislead

| Property | Behavior |
|---|---|
| Rewards | Order-conversion efficiency (Reg/Calls or Reg/Contacted). |
| Ignores | SOV per order, acquisition rate, upsell. |
| Bias risk | Self-reinforcing — if R4 reps get more leads next week, their numerator inflates relative to R1. |
| New-rep bias | `IsBelow2Months` flag exists but is not used in the rank cut; new reps often land in R1 simply because their 10-week window is empty. |
| Volume threshold | None — a rep with 5 contacts and 1 order has Reg/Contacted = 20% and can rank R4. |

---

## C. Data quality and limitations

| Check | Result |
|---|---|
| Rows | 41,779 |
| Date range | 2024-01-01 → 2026-05-06 |
| Unique employees | 144 |
| Segments | Biblical Related, Hebrew Related, Popular Languages, Coding, Langaroo |
| `SemesterCategory` NULLs | 26 rows (0.06%) — dropped from segment-level analysis |
| `RankRegFromCalls` NULLs | 1,102 rows — joins missing in `fact_EmployeesRank_NewLogic` for that week |
| `RankRegFromCalls` = -1 | 606 rows — rep had zero calls that week (correctly unranked) |
| Duplicates by (Date, Employee, Language, Semester) | None — already aggregated by the view |
| Tiny-segment risk | **Langaroo: 1,045 calls / 111 contacted across 17 reps** — directional only. **Coding: 63,887 calls / 4,764 contacted across 17 reps** — usable but each rank cell is small. |

**Confidence flags used in this analysis:**
- **Low** = < 200 calls or < 30 contacted in the period — do not draw conclusions.
- **Medium** = 200–1,000 calls and 30–100 contacted — directional only.
- **High** = ≥ 1,000 calls and ≥ 100 contacted — reliable.

---

## D. Main KPI definitions

| Goal | Volume KPI | Per-call efficiency | Per-contact efficiency |
|---|---|---|---|
| Revenue / SOV | `StatSOVCRM` | `StatSOVCRM / Calls` | `StatSOVCRM / Contacted` |
| Orders / registrations | `Orders` | `Orders / Calls` | `Orders / Contacted` |
| Acquisitions / first-time orders | `Acquisitions` | `Acquisitions / Calls` | `Acquisitions / Contacted` |
| Workload | `Calls`, `Contacted` | `Calls / Contacted` | — |

**Use efficiency KPIs for ranking and allocation decisions.** Use volume KPIs only to size the prize.

---

## E. Segment-by-segment findings

### E.1 Biblical Related (largest segment — 1.81 M calls, 110 K contacted, $7.0 M SOV, 129 reps)

**Call/contact distribution by rank (Rank by Calls):**

| Rank | Calls | Call% | Contact% | SOV% | Order% |
|---|---:|---:|---:|---:|---:|
| R1 | 441,519 | **24.5%** | 19.1% | 14.1% | 13.9% |
| R2 | 444,954 | **24.7%** | 20.1% | 18.1% | 18.4% |
| R3 | 460,280 | 25.5% | 24.1% | 25.4% | 25.2% |
| R4 | 456,331 | **25.3%** | **36.7%** | **42.4%** | **42.6%** |

**Efficiency:**

| Rank | SOV/call | Orders/call | SOV/contact | Orders/contact | Calls/contact |
|---|---:|---:|---:|---:|---:|
| R1 | $2.20 | 0.48% | $46.9 | 10.2% | 21.3 |
| R2 | $2.79 | 0.63% | $57.1 | 12.8% | 20.4 |
| R3 | $3.79 | 0.83% | $66.8 | 14.6% | 17.6 |
| R4 | **$6.39** | **1.42%** | **$73.2** | **16.2%** | **11.5** |

- **Rank logic validated:** SOV/call grows 2.20 → 2.79 → 3.79 → 6.39 (R4 = 2.9× R1).
- **Allocation issue:** Calls are split almost evenly across all 4 ranks (24.5 / 24.7 / 25.5 / 25.3) but SOV share is 14% / 18% / 25% / 42%. **R4 is starved of calls relative to its productivity.** Shifting ~10 pp of call volume from R1 → R4 would (at current efficiency) lift SOV by ~$420 K/year.
- **Best reps (high confidence, top SOV/call):** Rep-345DDE ($14.16), Rep-7C95D3 ($11.81), Rep-E5EB3C ($11.10).
- **Weak reps (high confidence, lowest SOV/call):** Rep-86B557 ($0.00, 1,723 calls), Rep-2519A6 ($0.23, 3,625 calls), Rep-A81918 ($0.34, 6,569 calls). All have an avg rank of R1 — **these are the reps that should receive coaching or fewer calls**.
- **Recommendation:** maintain ≥ 5% of calls per rank for testing; otherwise shift ~50,000 calls/year from R1 to R4.

### E.2 Hebrew Related (616 K calls, 41 K contacted, $4.7 M SOV, 112 reps)

| Rank | Call% | Contact% | SOV% | Order% | SOV/call | Orders/call |
|---|---:|---:|---:|---:|---:|---:|
| R1 | 24.3% | 17.2% | 14.2% | 14.5% | $4.50 | 0.76% |
| R2 | 22.9% | 18.4% | 15.8% | 16.2% | $5.34 | 0.92% |
| R3 | 27.3% | 27.0% | 27.8% | 28.0% | $7.84 | 1.31% |
| R4 | 25.5% | 37.3% | **40.0%** | 41.0% | **$12.08** | **2.05%** |

- **Rank logic validated.** R4 SOV/call is **2.7× R1**, the strongest lift of any segment.
- **R4 under-allocated calls** by ~14 pp vs SOV share. Shifting from R1+R2 → R4 has the biggest revenue impact.
- **Best reps:** Rep-7C95D3 ($24.92 SOV/call), Rep-D2370D ($23.71), Rep-345DDE ($23.08).
- **Weak high-volume reps:** Rep-839DC8 (4,750 calls, $0 SOV — likely disabled mid-period; verify status), Rep-D1E978 ($1.03 vs $7.68 segment avg).

### E.3 Popular Languages (115 K calls, 5,285 contacted, $118 K SOV, 59 reps)

| Rank | Call% | Contact% | SOV% | SOV/call |
|---|---:|---:|---:|---:|
| R1 | 26.4% | 21.5% | 14.2% | $0.55 |
| R2 | 21.7% | 17.6% | 10.9% | $0.52 |
| R3 | 24.4% | 22.9% | 23.3% | $0.98 |
| R4 | **27.6%** | **38.0%** | **51.6%** | **$1.92** |

- **Most over-exploited rank gap:** R4 generates 52% of SOV but receives only 28% of calls. **Biggest single optimization target in the data.**
- **R1 and R2 efficiency is virtually identical** ($0.55 vs $0.52) — the rank logic does not really separate R1 from R2 here. Treat them as one tier.
- **Best rep:** Rep-FBE974 (Levy Marc area, $2.13/call, +107% vs segment avg). **Significantly under-utilized at 13,935 calls.**

### E.4 Coding (64 K calls, 4,764 contacted, $384 K SOV, 17 reps)

| Rank | Call% | SOV% | SOV/call | SOV/contact | Orders/call |
|---|---:|---:|---:|---:|---:|
| R1 | 37.4% | 31.0% | $4.98 | $85.7 | 1.10% |
| R2 | 4.6% | 4.2% | $5.41 | $80.2 | 1.35% |
| R3 | 34.6% | 37.6% | $6.53 | **$88.4** | 1.50% |
| R4 | 23.3% | 27.0% | **$6.98** | $67.4 | **1.66%** |

- **Rank logic is partially broken here.** SOV/call is monotonic (good) but **SOV/contact actually peaks at R3** ($88.4) and drops at R4 ($67.4). R4 reps make fewer calls per contact (9.7 vs 13.5) and convert at a slightly higher rate, but each contact yields less revenue.
- **R3 is the most cost-effective rank in Coding** by SOV/contact. The volume distribution is roughly correct but R4 should *not* receive more call volume in this segment until the SOV/contact gap is investigated.
- **Only 17 reps in segment** and 3 reps cover R1, R2, R3 each — **rank cells are noisy**. Treat any conclusion as directional.

### E.5 Langaroo (1,045 calls, 111 contacted, $19 K SOV, 17 reps)

- **Total volume is too small** to draw any conclusion. Each rank has 143–348 calls and 15–34 contacted customers.
- Directional read: SOV/call rises monotonically R1 → R4 ($9.18 → $27.19), which suggests the logic works directionally, but no allocation decisions should be made here without 3–6 more months of data.

---

## F. Rank-allocation opportunities

### F.1 Where R4 is **under**-allocated calls (give it more)

| Segment | R4 call share | R4 SOV share | Gap | Recommended shift |
|---|---:|---:|---:|---|
| Popular Languages | 27.6% | 51.6% | +24.0 pp | Move ~24 pp of calls from R1+R2 to R4 (with cap below). |
| Biblical Related | 25.3% | 42.4% | +17.1 pp | Move ~10 pp from R1+R2 to R3+R4. |
| Hebrew Related | 25.5% | 40.0% | +14.5 pp | Move ~10 pp from R1+R2 to R3+R4. |
| Langaroo | 22.5% | 36.4% | +13.9 pp | Hold — sample too small. |

### F.2 Where R4 is correctly or over-allocated (do not shift more in)

| Segment | R4 call share | R4 SOV share | Gap |
|---|---:|---:|---|
| Coding | 23.3% | 27.0% | +3.7 pp — close to balanced; R3 is actually the best per-contact in this segment. |

### F.3 Where R1 / R2 / R3 need more *test* volume (under-tested)

- **Coding R2** has only 2,963 calls (4.6% of segment). Cell is too small to trust the rank assignment. Increase to ≥ 5%.
- **Langaroo all ranks** are under-tested.
- **Popular Languages R1 + R2** look weak ($0.55 / $0.52 SOV/call) but each is bordering "Medium" confidence — keep at least 10% of testing volume there for now.

### F.4 Where current allocation may be hurting business results

- **R1 in Biblical Related** receives 25% of calls but generates 14% of SOV — the single biggest waste of call volume in the dataset (~$1.0 M SOV gap if redirected at R4 efficiency).
- **R1 in Hebrew Related** receives 24% of calls but generates 14% of SOV (~$370 K gap).
- **R1 in Popular Languages** receives 26% of calls but generates 14% of SOV.

---

## G. Recommended optimized allocation model

### G.1 Per-segment 70 / 20 / 10 framework

For every segment with **High** confidence (Biblical, Hebrew, Popular Languages):

| Bucket | Share | Targets |
|---|---:|---|
| **Exploit** — proven winners | 70% of calls/contacts | R3 + R4 reps with positive SOV/call lift vs segment avg AND High confidence. |
| **Develop** — promising but unproven | 20% | R2 reps and R3 reps with neutral lift. |
| **Explore** — testing | 10% | R1 reps + new reps (`IsBelow2Months = 1`). Minimum 200 calls and 30 contacted customers per rep per 10-week window so the next rank cycle has a reliable signal. |

For **Coding**: keep current 30/35/35 R1/R3/R4 split until the R4 SOV-per-contact gap is investigated. Do **not** shift more calls into R4 yet.

For **Langaroo**: do not change. Increase total volume only if the business decides this segment is strategic.

### G.2 Hard caps to avoid runaway concentration

- No single rank may exceed **40%** of calls in any segment unless its SOV/call lift over the next-best rank is at least **50%**.
- No single rep may exceed **15%** of segment calls unless their SOV/call is at least **50%** above segment average AND they have **High** confidence.
- Each rank must receive at least **5%** of segment call volume **AND** each rep must hit at least **30 contacted customers** per 10-week window, otherwise the next rank cycle is unreliable.

### G.3 Concrete shifts to try this week (Biblical Related as worked example)

- Total weekly calls in Biblical: ~17,000.
- R1 currently gets ~4,300 calls/week, R4 gets ~4,400. Move ~700 calls/week from R1 to R3+R4 reps with High confidence and positive lift.
- Expected lift, holding everything else constant: 700 × ($6.39 − $2.20) ≈ **$2,900 SOV/week** = ~$150 K/year, just from this one segment.

---

## H. Management action plan

| Horizon | Action |
|---|---|
| **Immediately** | Stop sending new calls to the 5 weakest reps in Biblical Related and Hebrew Related (listed on the dashboard); redirect to top 5 reps in same segment until next rank cycle. |
| **Weekly monitor** | Watch the dashboard's *Rank allocation* page. Flag any segment where (Call share − SOV share) per rank exceeds ±10 pp. |
| **A/B test (next 2 rank cycles)** | In Biblical Related and Hebrew Related, shift 10 pp of R1 calls to R3+R4 for the experiment group only. Compare aggregate SOV to control. |
| **Investigate** | Coding: why does R4 have lower SOV/contact than R3? Likely lower-value courses or shorter sales calls. Adjust or split the rank by course price band. |
| **Logic improvement** | Add a minimum-volume floor: rank = `-1` if `NumOfContacted < 20` OR `NumOfCalls < 100`. This removes noise-based R4 placements. |
| **Logic improvement** | Consider ranking by `SOV / Calls` (or a blended SOV+Reg score) instead of pure `Reg / Calls`. The current logic is blind to revenue and over-rewards low-ticket conversions. |
| **Bias check** | Add an audit query: % of calls each rep received this cycle vs last cycle's rank. If R4 keeps getting more calls automatically, exploration volume may collapse over time. |

---

## I. Dashboard plan — free, professional, public, no Perplexity branding

### I.1 Comparison of free options

| Tool | Public link looks pro? | Hides Perplexity brand? | Free tier limit | Pros | Cons |
|---|---|---|---|---|---|
| **GitHub Pages** ✅ (recommended) | `username.github.io/repo` or custom domain | Yes — your GitHub username only | 1 GB site, 100 GB bandwidth/mo | Free, custom domain, full HTML/JS, no third-party branding, version-controlled, anyone with the link can view. | Static only — refresh = re-push the data file. |
| Looker Studio | `lookerstudio.google.com/...` | Yes (Google branding only) | Free | Live refresh from Sheets/CSV, no code. | Public link is only "anyone with link", URL is long, harder to white-label. |
| Power BI Publish-to-web | `app.powerbi.com/view?...` | Yes | Free | Powerful visuals. | Publish-to-web makes data **fully public** with no auth — risky for employee data; URL contains "powerbi.com". |
| Tableau Public | `public.tableau.com/views/...` | Tableau branding stays | Free | Strong visuals. | Workbook becomes **publicly searchable** on Tableau Public — never use for sensitive employee data. |
| Google Sheets dashboard | `docs.google.com/spreadsheets/...` | Google branding | Free | Easiest. | Looks like a spreadsheet, not a dashboard. |
| Streamlit Community Cloud | `<app>.streamlit.app` | "Streamlit" appears in URL | Free | Python interactivity. | Has Streamlit branding by default, app sleeps after inactivity. |
| Vercel / Netlify static | Custom domain | Yes | Free | Same as GitHub Pages. | Slightly more setup. |

**Winner for your case: GitHub Pages.** It is free, supports a custom domain, has zero third-party branding, can be private-by-obscurity (URL only) or fully public, and integrates with your existing GitHub workflow.

### I.2 Privacy considerations for employee-level data

- A GitHub Pages site is **served publicly**: anyone with the URL can view it. There is no built-in auth on the free tier.
- If you do not want real names exposed, do **not** ship `EmployeeName`. The dashboard I built **already pseudonymizes** every rep as `Rep-XXXXXX` (a stable hash of `EmployeeID`). The mapping is kept only in your private SQL warehouse.
- Options to protect further:
  1. **Custom domain + obscure path** (e.g. `analytics.yourdomain.com/r/c47/`) — security-by-obscurity.
  2. **Cloudflare Access / Cloudflare Pages** in front of the dashboard — free for ≤ 50 users, requires email login. This is the cleanest privacy upgrade.
  3. **GitHub Pages on a private repo** — requires GitHub Enterprise; not free.

### I.3 Step-by-step setup (the dashboard is already built and ready)

The dashboard files are in the workspace and will also be pushed to your GitHub. Two files only:

```
/dashboard/
   index.html      # the entire UI (Plotly + tabs + tables)
   data.json       # pre-aggregated, anonymized data (~160 KB)
```

To publish:

1. Push the `/dashboard` folder to a new GitHub repo (e.g. `kpi-rank-dashboard`).
2. **Settings → Pages → Source: Deploy from a branch → main / `/dashboard` (or `/`)**. GitHub will give you a URL like `https://<your-user>.github.io/kpi-rank-dashboard/`.
3. (Optional) **Settings → Pages → Custom domain**: enter `analytics.yourdomain.com`, add a CNAME record pointing to `<your-user>.github.io`. HTTPS is automatic.
4. **To refresh the data**: regenerate `data.json` from a fresh export of `vw_kpi_employee_rank` (the script is in this repo at `/scripts/build_data.py` once we push it), commit, push. The page reflects the new data immediately.
5. **To avoid any branding**: the dashboard already has none — the only attribution is in the footer ("Source: kpi_employee_rank_data… · vw_kpi_employee_rank · fact_EmployeesRank_NewLogic"). Edit `index.html` if you want to remove even that.

---

## J. Dashboard structure (already implemented)

**Page 1 — Executive overview:** 12 KPI tiles + grouped bar chart (call/contact/SOV/order share by segment) + dual-axis chart (SOV/call & orders/call by rank) + automated headline-insight callouts.
**Page 2 — Segment performance:** all five segments compared on SOV, calls, contacts, orders, acquisitions + sortable KPI table.
**Page 3 — Rank allocation:** drop-down for rank type + segment, side-by-side allocation-vs-outcome bars, efficiency chart, rank table with automated diagnostic callouts (over/under-allocated, monotonicity check).
**Page 4 — Representative performance:** scatter (SOV/call vs call volume, color = lift, size = SOV) + top-20 orders/call bar chart + sortable rep table with confidence flags. Filter by segment, min calls, confidence.
**Page 5 — Optimization opportunities:** Segment × Rank shift table with automated action labels + High-potential reps table + Over-exposed reps table + 70/20/10 framework.
**Page 6 — Logic & method:** plain-English explanation of the SQL and the rank cut, plus risks and confidence rules.

---

## K. Final recommendation

| Question | Recommendation |
|---|---|
| Should we trust the ranking logic? | **Yes in 3 of 5 segments (Biblical, Hebrew, Popular Languages).** Investigate Coding before relying on it. Langaroo: too small, do not act. |
| Should we change call allocation? | **Yes.** Move ~10 pp of calls from R1+R2 to R3+R4 in Biblical Related and Hebrew Related. Move ~15–20 pp in Popular Languages. |
| Should we change contact allocation? | **Yes**, mirroring calls. R4 already gets a higher contact share than call share, so the gap is narrower — focus on calls first. |
| Which segments first? | Popular Languages (highest gap), then Hebrew Related, then Biblical Related. |
| Which reps should get more calls? | The "High-potential" list on the *Optimization* page — High-confidence reps with > 20% SOV/call lift and below-median calls. |
| Which reps should get fewer calls? | The "Over-exposed" list — High-confidence reps with > 20% negative lift and above-median calls. |
| What dashboard solution? | **GitHub Pages**, repo `kpi-rank-dashboard`, optional custom domain, optional Cloudflare Access for auth. |

---

*Prepared from `vw_kpi_employee_rank_6_5_26.sql`, `VER6_Historical_Run_Fact_Employee_Rank_New_Logic_2026-04-28.sql`, and `kpi_employee_rank_data_7_5_26.xlsx`. All employee names in the dashboard are pseudonymized; the mapping lives only in your data warehouse.*
