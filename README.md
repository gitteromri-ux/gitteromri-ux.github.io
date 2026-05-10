# Employee Rank & Allocation Dashboard

Interactive dashboard analyzing the call-center ranking model
(`vw_kpi_employee_rank` / `fact_EmployeesRank_NewLogic`) and the
business question of whether calls and contacted customers are
allocated to the right representatives and ranks.

**Rank convention:** R1 = weakest, R4 = strongest.

## What's in this repo

| File | Purpose |
|---|---|
| `index.html` | Self-contained dashboard (HTML + Plotly + vanilla JS). Six tabs. |
| `data.json` | Pre-aggregated, **pseudonymized** dataset that powers the dashboard. ~160 KB. |
| `ANALYSIS.md` | Full written analysis, segment-by-segment findings, recommendations. |
| `scripts/build_data.py` | Re-build `data.json` from a fresh Excel export of `vw_kpi_employee_rank`. |
| `data/raw/*.sql` | The source SQL (the view + the historical rank-build procedure) for reference. |

## Live dashboard

After Pages is enabled (Settings → Pages → Source: Deploy from a branch
→ `main` / `/`), the dashboard will be served at:

```
https://<your-github-user>.github.io/<repo-name>/
```

Add a custom domain in **Settings → Pages → Custom domain** for a
fully white-labelled URL.

## Refreshing the data

```bash
# 1. Export the latest weekly data from SQL Server:
#    SELECT * FROM vw_kpi_employee_rank ORDER BY Date;
#    Save as kpi_employee_rank_data.xlsx in this repo.
# 2. Rebuild data.json
python3 scripts/build_data.py path/to/kpi_employee_rank_data.xlsx
# 3. Commit and push
git add data.json && git commit -m "Refresh data" && git push
```

The dashboard will pick up the new data on the next page load.

## Privacy

`data.json` contains **only pseudonymized** representative IDs
(`Rep-<6-char-hash>`). The mapping back to real employee names lives
only in your data warehouse. Real names are never shipped to the
dashboard.

If you need authenticated access, put Cloudflare Access in front of
the GitHub Pages site (free for ≤ 50 users).

## Headline findings

See [ANALYSIS.md](./ANALYSIS.md) for the full report. Top-level:

- The rank logic is **validated** in Biblical Related, Hebrew Related,
  and Popular Languages — SOV/call rises monotonically R1 → R4.
- The rank logic is **broken in Coding** — R3 outperforms R4 on
  SOV-per-contact.
- **R4 is consistently under-allocated calls** in 3 of 5 segments;
  R1 + R2 are over-allocated. Shifting ~10 pp of calls from R1 to R4
  in Hebrew Related alone would lift annual SOV by ~$370 K at current
  efficiency.
- Recommended allocation: **70 / 20 / 10** (exploit / develop /
  explore) per segment, with hard caps to prevent runaway
  concentration.
