# ==============================
# REPORT MODULE
# ==============================

import os
import re
import json
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict
from config import DEBUG_MODE, UPLOAD_FOLDER

from argx import write_argx, make_pay_period_fn
from heatmap import generate_heatmap_png
from parser import parse_pdf

# ==============================
# PAY PERIOD LOGIC
# ==============================
get_pay_period = make_pay_period_fn(datetime(2025, 1, 13))

# ==============================
# LOAD ASSIGNMENT CODES
# ==============================
def load_assignment_codes(target_date, df=None, raw_codes=None):
    base_path = os.path.join(os.path.dirname(__file__), "static")

    def load_normalized_json(path):
        with open(path, "r") as f:
            return set(code.strip().upper() for code in json.load(f))

    # Load all code sets
    special_assignments = load_normalized_json(os.path.join(base_path, "arg_asmnts_sp.json"))
    weekday_assignments = load_normalized_json(os.path.join(base_path, "arg_asmnts.json"))
    sat_assignments = load_normalized_json(os.path.join(base_path, "arg_asmnts_sat.json"))
    sun_assignments = load_normalized_json(os.path.join(base_path, "arg_asmnts_sun.json"))

    # Normalize daily shifts (if any data exists for that date)
    if df is not None:
        daily_shifts = set(
            code.strip().upper()
            for code in df[df["DateObj"] == target_date]["Shift"].unique()
            if isinstance(code, str)
        )

        # Step 1: Presence of SA1 triggers special
        if "SA1" in daily_shifts:
            if DEBUG_MODE:
                print(f"[DEBUG] Detected SA1 — using SPECIAL assignment set for {target_date}")
            return list(special_assignments)

    # Step 2: Split by weekday number
    weekday = target_date.weekday()

    if weekday == 5:
        return list(sat_assignments)
    elif weekday == 6:
        return list(sun_assignments)
    else:
        return list(weekday_assignments)

# ==============================
# GET FILTER NAME
# ==============================
def get_name_filter(filter_type):
    base = os.path.join(os.path.dirname(__file__), "static")
    if filter_type == "ft":
        return set(json.load(open(os.path.join(base, "emp_ft.json"))))
    elif filter_type == "pt":
        return set(json.load(open(os.path.join(base, "emp_pt.json"))))
    else:
        ft = set(json.load(open(os.path.join(base, "emp_ft.json"))))
        pt = set(json.load(open(os.path.join(base, "emp_pt.json"))))
        return ft | pt

# ==============================
# GROUP SHIFT BY DATE + TYPE
# ==============================
def group_by_shift(df, target_date, raw_codes, filter_type="all"):
    shifts = defaultdict(list)
    all_codes = load_assignment_codes(target_date, df, raw_codes)
    name_filter = get_name_filter(filter_type)

    daily = df[df["DateObj"] == target_date]
    seen = set()

    for _, row in daily.iterrows():
        name = row["Name"].strip()
        code = row["Shift"].strip().upper()
        if name in name_filter:
            seen.add(code)
            shifts[row["Type"]].append((name, code))

    unassigned = set(all_codes) - seen
    for code in sorted(unassigned):
        shifts["Day"].append(("Vacant", code))

    return dict(shifts)


# ==============================
# API: WHO IS WORKING ON DATE
# ==============================
def get_working_on_date(df, date_str):
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}
    return group_by_shift(df, date_obj)
    
# ==============================
# API: Get Shift Breakdown by Date
# ==============================
def get_shifts_for_date(date_str):
    try:
        stop_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}, 400

    pdf_paths = [
        os.path.join(UPLOAD_FOLDER, f)
        for f in os.listdir(UPLOAD_FOLDER)
        if f.endswith(".pdf")
    ]

    if not pdf_paths:
        return {"error": "No PDF data available"}, 404

    _, _, df = process_report(pdf_paths, return_df=True, stop_on_date=stop_date)

    if df.empty:
        return {"error": "No shift data available for this date"}, 404

    result = get_working_on_date(df, date_str)
    if DEBUG_MODE:
        print(f"[DEBUG] Shift data returned for {date_str}: {result}")
    return result, 200

# ==============================
# MAIN REPORT PROCESSOR
# ==============================
def process_report(pdf_paths, return_df=False, stop_on_date=None):
    if DEBUG_MODE:
        print(f"[DEBUG] Parsing {len(pdf_paths)} PDF(s)...")

    # === Parse PDFs with optional stop date
    frames_with_swaps = [parse_pdf(p, stop_on_date=stop_on_date) for p in pdf_paths]
    frames = [f[0] for f in frames_with_swaps]
    swaps_all = sum((f[1] for f in frames_with_swaps), [])

    # === Track file -> date mapping
    file_date_map = {}
    for path in pdf_paths:
        match = re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(path))
        if match:
            file_date_map[os.path.basename(path)] = pd.to_datetime(match.group(1))

    # === Tag metadata
    for frame, path in zip(frames, pdf_paths):
        fname = os.path.basename(path)
        frame["SourceFile"] = fname
        frame["FileDate"] = file_date_map.get(fname)

    # === Consolidate
    df = pd.concat(frames, ignore_index=True)
    df = df.sort_values(by=["DateObj", "Shift", "FileDate"], ascending=[True, True, False])
    df = df.drop_duplicates(subset=["DateObj", "Shift"], keep="first")

    if df.empty:
        if DEBUG_MODE:
            print("[DEBUG] No data found in PDF parsing.")
        return [], {}, pd.DataFrame()

    # === Extract Shift Codes AFTER df is built
    raw_codes = set(df["Shift"].str.upper().unique())

    # === Enrich
    df["WeekStart"] = df["DateObj"].apply(lambda d: d - timedelta(days=d.weekday()))
    first_date = df["DateObj"].min().strftime("%Y-%m-%d")

    # === Save Excel
    output_filename = f"ARGX_{first_date}.xlsx"
    output_path = os.path.join("/tmp", output_filename)
    write_argx(df, output_path, get_pay_period)
    if DEBUG_MODE:
        print(f"[DEBUG] ARGX saved to: {output_path}")

    # === Generate Heatmap
    heatmap_path = generate_heatmap_png(df, first_date)

    # === Rankings + Stats
    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    current_pp = get_pay_period(today)

    stats = {
        "total_hours_week": round(df[df["WeekStart"] == week_start]["Hours"].sum()),
        "top_day": df.groupby("DateObj")["Hours"].sum().idxmax(),
        "top_day_hours": int(df.groupby("DateObj")["Hours"].sum().max()),
        "rankings": {
            "weekly": list(df[df["WeekStart"] == week_start]
                .groupby("Name")["Hours"].sum()
                .sort_values(ascending=False).astype(int).items()),
            "period": list(df[df["DateObj"].apply(get_pay_period) == current_pp]
                .groupby("Name")["Hours"].sum()
                .sort_values(ascending=False).astype(int).items()),
            "total": list(df
                .groupby("Name")["Hours"]
                .sum().sort_values(ascending=False).astype(int).items())
        },
        "swaps": swaps_all
    }

    output_files = [output_path, heatmap_path]

    if DEBUG_MODE:
        print(f"[DEBUG] Finished processing. Total shifts: {len(df)}")

    if return_df:
        return output_files, stats, df, raw_codes
    return output_files, stats
