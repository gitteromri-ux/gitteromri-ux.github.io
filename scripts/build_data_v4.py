#!/usr/bin/env python3
"""
Build data.json for the goal-based dashboard — LIVE SEGMENTS ONLY.

Filters to only the school × language combinations that are actively running:
- Schools: Hebrew Related, Biblical Related, Popular Languages
- Languages: English, Spanish
"""
import json, hashlib, os
import pandas as pd

LIVE_SCHOOLS = {"Hebrew Related", "Biblical Related"}
LIVE_LANGUAGES = {"English", "Spanish"}

def pseudo(eid):
    return "Rep-" + hashlib.md5(str(eid).encode()).hexdigest()[:6].upper()

def rank_lbl(x):
    if pd.isna(x): return "NA"
    if x == -1: return "Unranked"
    return f"R{int(x)}"

df = pd.read_pickle("/tmp/df_v2.pkl")
df["Rep"] = df["EmployeeID"].apply(pseudo)
df = df.dropna(subset=["SemesterCategory", "LanguageName"]).copy()

# Filter to live segments only
before = len(df)
df = df[df["SemesterCategory"].isin(LIVE_SCHOOLS) & df["LanguageName"].isin(LIVE_LANGUAGES)].copy()
after = len(df)
print(f"Filtered rows: {before:,} -> {after:,} ({after/before*100:.1f}% kept)")

df["RankCalls"] = df["RankRegFromCalls"].apply(rank_lbl)
df["RankCont"]  = df["RankRegFromContacted"].apply(rank_lbl)
df["SOV"] = df["ActualStatCRMCourseSOV"].fillna(0)
df["Upsales"] = df["UpsalesAmount"].fillna(0)
df["Month"] = df["Date"].dt.strftime("%Y-%m")

agg = {"Calls":"sum","Contacted":"sum","Orders":"sum","Acquisitions":"sum","SOV":"sum","Upsales":"sum"}
fact = (df.groupby(["Month","SemesterCategory","LanguageName","Rep","RankCalls","RankCont"], as_index=False)
          .agg(agg))
fact["SOV"] = fact["SOV"].round(2); fact["Upsales"] = fact["Upsales"].round(2)

records = []
for r in fact.itertuples(index=False):
    records.append({
        "m": r.Month, "s": r.SemesterCategory, "l": r.LanguageName, "r": r.Rep,
        "rc": r.RankCalls, "ro": r.RankCont,
        "c": int(r.Calls), "ct": int(r.Contacted),
        "o": int(r.Orders), "a": int(r.Acquisitions),
        "v": float(r.SOV), "u": float(r.Upsales),
    })

months = sorted(df["Month"].unique().tolist())
schools = sorted(df["SemesterCategory"].unique().tolist())
languages = sorted(df["LanguageName"].unique().tolist())

out = {
    "meta": {
        "DateMin": str(df["Date"].min().date()),
        "DateMax": str(df["Date"].max().date()),
        "Months": months,
        "Schools": schools,
        "Languages": languages,
        "GeneratedAt": pd.Timestamp.now(tz="UTC").isoformat(),
        "TotalRows": len(records),
        "Scope": "live_segments_only",
    },
    "facts": records,
}

p = "/home/user/workspace/dashboard/data.json"
with open(p, "w") as f:
    json.dump(out, f, separators=(",", ":"))
print(f"Wrote {p}: {os.path.getsize(p):,} bytes ({os.path.getsize(p)/1024/1024:.2f} MB)")
print(f"Rows: {len(records):,}  Months: {len(months)}  Schools: {len(schools)}  Languages: {len(languages)}")
print(f"Schools kept: {schools}")
print(f"Languages kept: {languages}")
