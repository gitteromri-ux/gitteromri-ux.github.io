#!/usr/bin/env python3
"""Build data.json with monthly time-series so the dashboard can filter by date."""
import json
import hashlib
import pandas as pd
import numpy as np


def pseudo(eid):
    return "Rep-" + hashlib.md5(str(eid).encode()).hexdigest()[:6].upper()


def rank_lbl(x):
    if pd.isna(x):
        return "NA"
    if x == -1:
        return "Unranked"
    return f"R{int(x)}"


df = pd.read_pickle("/tmp/df.pkl")
df["Rep"] = df["EmployeeID"].apply(pseudo)
df = df.dropna(subset=["SemesterCategory"]).copy()
df["RankCalls"] = df["RankRegFromCalls"].apply(rank_lbl)
df["RankCont"] = df["RankRegFromContacted"].apply(rank_lbl)
df["SOV"] = df["ActualStatCRMCourseSOV"].fillna(0)
df["Upsales"] = df["UpsalesAmount"].fillna(0)
df["Month"] = df["Date"].dt.strftime("%Y-%m")

# All months in order
months = sorted(df["Month"].unique().tolist())

# ---------- Monthly fact rows: (month, segment, rankCalls, rankCont) ----------
# We want to filter dynamically client-side. To keep the file small, we ship
# monthly aggregates at (Month, SemesterCategory, RankCalls, RankCont, Rep)
# so the client can filter by date range + segment and recompute everything.
agg_cols = {
    "Calls": "sum", "Contacted": "sum", "Orders": "sum",
    "Acquisitions": "sum", "SOV": "sum", "Upsales": "sum",
}

# Per-month per-segment per-rep rows (for Reps tab aggregation)
fact = (
    df.groupby(["Month", "SemesterCategory", "Rep", "RankCalls", "RankCont"], as_index=False)
      .agg(agg_cols)
)

# Round numeric for compactness
for c in ["SOV", "Upsales"]:
    fact[c] = fact[c].round(2)

# Convert to lean records (short keys to shrink JSON)
fact_records = []
for r in fact.itertuples(index=False):
    fact_records.append({
        "m": r.Month,
        "s": r.SemesterCategory,
        "r": r.Rep,
        "rc": r.RankCalls,
        "ro": r.RankCont,
        "c": int(r.Calls),
        "ct": int(r.Contacted),
        "o": int(r.Orders),
        "a": int(r.Acquisitions),
        "v": float(r.SOV),
        "u": float(r.Upsales),
    })

segments = sorted(df["SemesterCategory"].unique().tolist())

out = {
    "meta": {
        "DateMin": str(df["Date"].min().date()),
        "DateMax": str(df["Date"].max().date()),
        "Months": months,
        "Segments": segments,
        "GeneratedAt": pd.Timestamp.utcnow().isoformat(),
        "TotalRows": len(fact_records),
    },
    "facts": fact_records,
}

import os
out_path = "/home/user/workspace/dashboard/data.json"
with open(out_path, "w") as f:
    json.dump(out, f, separators=(",", ":"))

size = os.path.getsize(out_path)
print(f"Wrote {out_path}: {size:,} bytes ({size/1024/1024:.2f} MB)")
print(f"Rows: {len(fact_records):,}")
print(f"Months: {len(months)} ({months[0]} → {months[-1]})")
print(f"Segments: {segments}")
