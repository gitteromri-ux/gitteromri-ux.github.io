#!/usr/bin/env python3
"""
Build data.json for the employee-rank dashboard from a fresh export of
vw_kpi_employee_rank (saved as .xlsx).

Usage:
    python3 build_data.py /path/to/kpi_employee_rank_data.xlsx [output.json]

Default output path: ../data.json (relative to this script).

Employee names are NOT shipped — every EmployeeID is pseudonymized to
a stable Rep-XXXXXX hash so the dashboard can be hosted on a public URL.
"""
import sys
import json
import hashlib
from pathlib import Path

import numpy as np
import pandas as pd


def pseudo(eid: int) -> str:
    return "Rep-" + hashlib.md5(str(eid).encode()).hexdigest()[:6].upper()


def rank_lbl(x):
    if pd.isna(x):
        return "NA"
    if x == -1:
        return "Unranked"
    return f"R{int(x)}"


def main(xlsx_path: str, out_path: str | None = None) -> None:
    xlsx = Path(xlsx_path).expanduser().resolve()
    if not xlsx.exists():
        raise SystemExit(f"Input file not found: {xlsx}")

    df = pd.read_excel(xlsx)

    # Anonymize
    df["Rep"] = df["EmployeeID"].apply(pseudo)
    df = df.dropna(subset=["SemesterCategory"]).copy()
    df["RankCalls"] = df["RankRegFromCalls"].apply(rank_lbl)
    df["RankCont"] = df["RankRegFromContacted"].apply(rank_lbl)

    valid_calls = df[df["RankCalls"].isin(["R1", "R2", "R3", "R4"])].copy()
    valid_cont = df[df["RankCont"].isin(["R1", "R2", "R3", "R4"])].copy()

    def agg(group_cols, src):
        return (
            src.groupby(group_cols, observed=True)
            .agg(
                Contacted=("Contacted", "sum"),
                Calls=("Calls", "sum"),
                Orders=("Orders", "sum"),
                Acquisitions=("Acquisitions", "sum"),
                SOV=("StatSOVCRM", "sum"),
                Upsales=("UpsalesAmount", "sum"),
                UniqueEmp=("EmployeeID", "nunique"),
            )
            .reset_index()
        )

    data: dict = {}
    data["totals"] = {
        "Calls": int(df["Calls"].sum()),
        "Contacted": int(df["Contacted"].sum()),
        "Orders": int(df["Orders"].sum()),
        "Acquisitions": int(df["Acquisitions"].sum()),
        "SOV": float(df["StatSOVCRM"].sum()),
        "Upsales": float(df["UpsalesAmount"].sum()),
        "UniqueReps": int(df["EmployeeID"].nunique()),
        "DateMin": str(pd.to_datetime(df["Date"]).min().date()),
        "DateMax": str(pd.to_datetime(df["Date"]).max().date()),
    }

    seg_tot = agg(["SemesterCategory"], df)
    data["segments"] = seg_tot.to_dict(orient="records")

    def add_shares(g, key):
        for col, alias in [
            ("Calls", "CallShare"),
            ("Contacted", "ContactShare"),
            ("Orders", "OrderShare"),
            ("SOV", "SOVShare"),
            ("Acquisitions", "AcqShare"),
        ]:
            g[alias] = g.groupby("SemesterCategory")[col].transform(
                lambda s: 100 * s / s.sum()
            )
        g["SOVperCall"] = g["SOV"] / g["Calls"]
        g["OrdersPerCall"] = g["Orders"] / g["Calls"] * 100
        g["SOVperContact"] = g["SOV"] / g["Contacted"]
        g["OrdersPerContact"] = g["Orders"] / g["Contacted"] * 100
        g["AcqPerCall"] = g["Acquisitions"] / g["Calls"] * 100
        g["AcqPerContact"] = g["Acquisitions"] / g["Contacted"] * 100
        return g

    sr = add_shares(agg(["SemesterCategory", "RankCalls"], valid_calls), "RankCalls")
    data["seg_rank_calls"] = json.loads(sr.to_json(orient="records"))
    sr2 = add_shares(agg(["SemesterCategory", "RankCont"], valid_cont), "RankCont")
    data["seg_rank_contacted"] = json.loads(sr2.to_json(orient="records"))

    emp = (
        df.groupby(["SemesterCategory", "EmployeeID", "Rep"])
        .agg(
            Contacted=("Contacted", "sum"),
            Calls=("Calls", "sum"),
            Orders=("Orders", "sum"),
            Acquisitions=("Acquisitions", "sum"),
            SOV=("StatSOVCRM", "sum"),
            AvgRankCalls=("RankRegFromCalls", "mean"),
            AvgRankCont=("RankRegFromContacted", "mean"),
        )
        .reset_index()
    )
    emp["SOVperCall"] = emp["SOV"] / emp["Calls"].replace(0, np.nan)
    emp["SOVperContact"] = emp["SOV"] / emp["Contacted"].replace(0, np.nan)
    emp["OrdersPerCall"] = emp["Orders"] / emp["Calls"].replace(0, np.nan) * 100
    emp["OrdersPerContact"] = emp["Orders"] / emp["Contacted"].replace(0, np.nan) * 100
    emp["AcqPerCall"] = emp["Acquisitions"] / emp["Calls"].replace(0, np.nan) * 100

    def conf(c, ct):
        if c < 200 or ct < 30:
            return "Low"
        if c < 1000 or ct < 100:
            return "Medium"
        return "High"

    emp["Confidence"] = emp.apply(lambda r: conf(r["Calls"], r["Contacted"]), axis=1)

    seg_baselines = (
        sr.groupby("SemesterCategory")
        .agg(bSOV=("SOV", "sum"), bCalls=("Calls", "sum"), bOrders=("Orders", "sum"))
        .reset_index()
    )
    seg_baselines["BaselineSOVperCall"] = seg_baselines["bSOV"] / seg_baselines["bCalls"]
    seg_baselines["BaselineOrdersPerCall"] = (
        seg_baselines["bOrders"] / seg_baselines["bCalls"] * 100
    )
    emp = emp.merge(
        seg_baselines[
            ["SemesterCategory", "BaselineSOVperCall", "BaselineOrdersPerCall"]
        ],
        on="SemesterCategory",
        how="left",
    )
    emp["LiftSOVperCall"] = (emp["SOVperCall"] / emp["BaselineSOVperCall"] - 1) * 100
    emp["LiftOrdersPerCall"] = (
        emp["OrdersPerCall"] / emp["BaselineOrdersPerCall"] - 1
    ) * 100

    emp_pub = emp.drop(columns=["EmployeeID"]).copy()
    for c in [
        "SOV",
        "SOVperCall",
        "SOVperContact",
        "OrdersPerCall",
        "OrdersPerContact",
        "AcqPerCall",
        "BaselineSOVperCall",
        "BaselineOrdersPerCall",
        "LiftSOVperCall",
        "LiftOrdersPerCall",
        "AvgRankCalls",
        "AvgRankCont",
    ]:
        if c in emp_pub.columns:
            emp_pub[c] = emp_pub[c].round(3)
    data["employees"] = json.loads(emp_pub.to_json(orient="records"))

    out = Path(out_path) if out_path else Path(__file__).resolve().parent.parent / "data.json"
    out.write_text(json.dumps(data))
    print(f"Wrote {out}  ({out.stat().st_size:,} bytes, {len(data['employees'])} rep-segment rows)")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else None)
