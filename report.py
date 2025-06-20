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
def load_assignment_codes(target_date, df=None):
    base_path = os.path.join(os.path.dirname(__file__), "static")

    # Load all 3 lists
    with open(os.path.join(base_path, "arg_asmnts.json"), "r") as f:
        weekday_assignments = set(json.load(f))
    with open(os.path.join(base_path, "arg_asmnts_wkd.json"), "r") as f:
        weekend_assignments = set(json.load(f))
    with open(os.path.join(base_path, "arg_asmnts_sp.json"), "r") as f:
        special_assignments = set(json.load(f))

    weekday = target_date.weekday()

    # Weekends use weekend list
    if weekday in [5, 6]:
        return list(weekend_assignments)

    # If any special assignment appears in the df for this date, use special list
    if df is not None:
        day_assignments = set(
            df[df["DateObj"] == target_date]["Shift"].unique()
        )
        if special_assignments & day_assignments:
            return list(special_assignments)

    # Default to weekday
    return list(weekday_assignments)
        
# ==============================
# GROUP SHIFT BY DATE + TYPE
# ==============================
def group_by_shift(df, target_date):
    shifts = defaultdict(list)
    all_codes = load_assignment_codes(target_date, df)

    # Keep track of seen assignments
    seen_assignments = set()

    for _, row in df.iterrows():
        dt = datetime.combine(row["DateObj"], datetime.strptime(row["Start"], "%H:%M").time())
        if dt.date() == target_date:
            assignment = row["Shift"]
            seen_assignments.add(assignment)
            shifts[row["Type"]].append((row["Name"], assignment))

    # Inject Vacants
    unassigned = set(all_codes) - seen_assignments
    for vacant_code in sorted(unassigned):
        # Assign to shift type "Day" by default or customize logic
        shifts["Day"].append(("Vacant", vacant_code))

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
        return output_files, stats, df
    return output_files, stats
