# ==============================
# REPORT MODULE
# ==============================

import os
import re
import json
import pickle
import pandas as pd
from pathlib import Path
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
# CACHE LOGIC
# ==============================
CACHE_DIR = Path(UPLOAD_FOLDER) / ".cache"
CACHE_DIR.mkdir(exist_ok=True)

# ==============================
# CACHE KEY
# ==============================
def cache_key(pdf_path, stop_on_date):
    stat = os.stat(pdf_path)
    mod_time = int(stat.st_mtime)
    stop_str = stop_on_date.isoformat() if stop_on_date else "none"
    return f"{os.path.basename(pdf_path)}__{mod_time}__{stop_str}.pkl"

# ==============================
# LOAD CACHE
# ==============================
def load_cache(pdf_path, stop_on_date):
    key = cache_key(pdf_path, stop_on_date)
    file = CACHE_DIR / key
    if file.exists():
        with open(file, "rb") as f:
            return pickle.load(f)
    return None

# ==============================
# SAVE CACHE
# ==============================
def save_cache(pdf_path, stop_on_date, data):
    key = cache_key(pdf_path, stop_on_date)
    file = CACHE_DIR / key
    with open(file, "wb") as f:
        pickle.dump(data, f)

# ==============================
# LOAD ASSIGNMENT CODES
# ==============================
def load_assignment_codes(target_date, df=None, raw_codes=None):
    base_path = os.path.join(os.path.dirname(__file__), "static")
    json_path = os.path.join(base_path, "arg_assignments.json")

    # Load structured assignment JSON
    with open(json_path, "r") as f:
        asmnts = json.load(f)

    # Normalize helper
    def normalize(codes):
        return set(c.strip().upper() for c in codes)

    # Pull all lists
    holiday = normalize(asmnts.get("holiday", []))
    stat = normalize(asmnts.get("stat", []))
    base = normalize(asmnts.get("weekday_base", []))
    weekday_add = normalize(asmnts.get("weekday_add", []))
    friday_add = normalize(asmnts.get("friday_add", []))
    saturday = normalize(asmnts.get("saturday", []))
    sunday = normalize(asmnts.get("sunday", []))

    weekday = target_date.weekday()  # 0 = Monday ... 6 = Sunday
    is_weekday = weekday < 5

    if df is not None:
        daily_shifts = set(
            code.strip().upper()
            for code in df[df["DateObj"] == target_date]["Shift"].unique()
            if isinstance(code, str)
        )

        # HOLIDAY override — only if D3XX are NOT present
        if is_weekday:
            has_d3xx = any(re.match(r"D3\d{2}$", code) for code in daily_shifts)
            has_holiday_code = any(code in daily_shifts for code in holiday)

            if has_holiday_code and not has_d3xx:
                if DEBUG_MODE:
                    print(f"[DEBUG] Holiday trigger: {target_date} → D3XX not present, using holiday set")
                return list(holiday)

        # STAT override — only if any SA1–SA4 explicitly present
        if any(code in daily_shifts for code in ["SA1", "SA2", "SA3", "SA4"]):
            if DEBUG_MODE:
                print(f"[DEBUG] Stat day triggered — found SA code in shifts for {target_date}")
            return list(stat)

    # Regular day logic
    if weekday == 5:
        return list(saturday)
    elif weekday == 6:
        return list(sunday)
    elif weekday == 4:
        return list(base | friday_add)
    else:
        return list(base | weekday_add)

# ==============================
# NORMALIZE NAME
# ==============================
def normalize_name(name):
    return re.sub(r'\s+', ' ', name.strip()).casefold()

# ==============================
# EXTRAT SHIFT SORTING KEY
# ==============================
def extract_shift_sort_key(shift_code):
    import re
    match = re.match(r"([A-Za-z]+)(\d+)", shift_code)
    if match:
        prefix, num = match.groups()
        return (prefix.upper(), int(num))
    return (shift_code.upper(), 0)

# ==============================
# GET FILTER NAME
# ==============================
def get_name_filter(filter_type):
    base = os.path.join(os.path.dirname(__file__), "static")

    def load_names(file):
        with open(os.path.join(base, file), "r") as f:
            return set(normalize_name(name) for name in json.load(f))

    if filter_type == "ft":
        return load_names("emp_ft.json")
    elif filter_type == "pt":
        return load_names("emp_pt.json")
    else:
        return load_names("emp_ft.json") | load_names("emp_pt.json")

# ==============================
# GET SHIFT TYPE
# ==============================
def get_shift_type(code):
    code = code.strip().lower()
    w_day = {"w406", "w408", "w409", "w503", "w504", "w507", "w401", "w502"}
    w_evening = {"w505", "w508"}
    w_night = {"w501", "w506"}

    if re.match(r'^sa\d$', code) or re.match(r'^od\d+', code) or code == 'oe' or code in w_day:
        return "Day"
    elif code in w_evening:
        return "Evening"
    elif code in w_night:
        return "Night"
    elif re.match(r'^[dD]', code):
        return "Day"
    elif re.match(r'^[eE]', code):
        return "Evening"
    elif re.match(r'^[nN]', code):
        return "Night"
    return "Day"  # default fallback

# ==============================
# GROUP SHIFT BY DATE + TYPE
# ==============================
def group_by_shift(df, target_date, raw_codes=None, filter_type="all"):
    shifts = defaultdict(list)

    # Auto-infer raw_codes if not provided (for backward compatibility)
    if raw_codes is None:
        raw_codes = set(df["Shift"].str.upper().dropna().unique())

    all_codes = load_assignment_codes(target_date, df, raw_codes)

    daily = df[df["DateObj"] == target_date]

    # 1. Track all filled shifts (independent of filter)
    all_filled_codes = set(daily["Shift"].str.upper().dropna().unique())

    # 2. Apply filter to get only relevant employees (case-insensitive)
    name_filter = get_name_filter(filter_type)
    filtered = daily[daily["Name"].apply(normalize_name).isin(name_filter)]

    for _, row in filtered.iterrows():
        name = row["Name"].strip()
        code = row["Shift"].strip().upper()
        shifts[row["Type"]].append((name, code))

    # 3. Detect true vacancies: shift codes not filled by ANYONE
    truly_unassigned = set(all_codes) - all_filled_codes
    for code in sorted(truly_unassigned):
        shift_type = get_shift_type(code)
        shifts[shift_type].append(("🎯 Vacant", code))

    # 4. Sort Vacant first, then shift code
    for shift_type in shifts:
        shifts[shift_type].sort(
            key=lambda x: (0 if 'vacant' in x[0].lower() else 1, extract_shift_sort_key(x[1]))
        )

    return dict(shifts)

# ==============================
# API: WHO IS WORKING ON DATE
# ==============================
def get_working_on_date(df, date_str, raw_codes=None):
    try:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

    raw_codes = set(df["Shift"].str.upper().dropna().unique())
    return group_by_shift(df, date_obj, raw_codes)
    
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

    # ⬇️ Only fetch what we need — no stats, heatmap, or xlsx
    _, _, df, raw_codes = process_report(
        pdf_paths,
        return_df=True,
        stop_on_date=stop_date,
        steps=set() 
    )

    if df.empty:
        return {"error": "No shift data available for this date"}, 404

    result = get_working_on_date(df, date_str, raw_codes)
    if DEBUG_MODE:
        print(f"[DEBUG] Shift data returned for {date_str}: {result}")
    return result, 200

# ==============================
# MAIN REPORT PROCESSOR
# ==============================
def process_report(pdf_paths, return_df=False, stop_on_date=None, steps=None, filter_type="all"):
    if steps is None:
        steps = {"outputs", "heatmap", "stats", "swaps"}

    valid_steps = {"outputs", "heatmap", "stats", "swaps"}
    invalid = set(steps) - valid_steps
    if invalid:
        raise ValueError(f"Invalid steps: {invalid}")

    if DEBUG_MODE:
        print(f"[DEBUG] Parsing {len(pdf_paths)} PDF(s)...")

    # === Parse PDFs with optional stop date
    frames_with_swaps = []
    for path in pdf_paths:
        cached = load_cache(path, stop_on_date)
        if cached:
            frame, swaps = cached
        else:
            frame, swaps = parse_pdf(path, stop_on_date=stop_on_date)
            save_cache(path, stop_on_date, (frame, swaps))
        frames_with_swaps.append((frame, swaps))
    
    frames = [f[0] for f in frames_with_swaps]
    swaps_all = sum((f[1] for f in frames_with_swaps), [])

    # === Track file -> date mapping
    file_date_map = {
        os.path.basename(path): pd.to_datetime(re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(path)).group(1))
        for path in pdf_paths
        if re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(path))
    }

    # === Tag metadata
    for frame, path in zip(frames, pdf_paths):
        fname = os.path.basename(path)
        frame["SourceFile"] = fname
        frame["FileDate"] = file_date_map.get(fname)

    # === Consolidate DataFrame
    df = pd.concat(frames, ignore_index=True)
    df = df.sort_values(by=["DateObj", "Shift", "FileDate"], ascending=[True, True, False])
    df = df.drop_duplicates(subset=["DateObj", "Shift"], keep="first")

    if df.empty:
        if DEBUG_MODE:
            print("[DEBUG] No data found in PDF parsing.")
        return [], {}, pd.DataFrame()

    # === Extract Shift Codes
    raw_codes = set(df["Shift"].str.upper().dropna().unique())

    # === Enrich
    df["WeekStart"] = df["DateObj"].apply(lambda d: d - timedelta(days=d.weekday()))
    first_date = df["DateObj"].min().strftime("%Y-%m-%d")

    output_files = []

    # === Save Excel
    if "outputs" in steps:
        output_filename = f"ARGX_{first_date}.xlsx"
        output_path = os.path.join("/tmp", output_filename)
        write_argx(df, output_path, get_pay_period)
        output_files.append(output_path)
        if DEBUG_MODE:
            print(f"[DEBUG] ARGX saved to: {output_path}")

    # === Generate Heatmap
    if "heatmap" in steps:
        heatmap_path = generate_heatmap_png(df, first_date)
        output_files.append(heatmap_path)

    # === Rankings + Stats
    stats = {}
    if "stats" in steps:
        today = datetime.now().date()
        week_start = today - timedelta(days=today.weekday())
        current_pp = get_pay_period(today)
    
        name_filter = get_name_filter(filter_type)
        filtered_df = df[df["Name"].apply(normalize_name).isin(name_filter)]
    
        # Top Day Stats
        if not filtered_df.empty:
            top_day_group = filtered_df.groupby("DateObj")["Hours"].sum()
            top_day = top_day_group.idxmax()
            top_day_hours = int(top_day_group.max())
        else:
            top_day = ""
            top_day_hours = 0
    
        # New stats
        weekly_df = filtered_df[filtered_df["WeekStart"] == week_start]
        unique_employees = weekly_df["Name"].nunique()
        total_shifts = len(weekly_df)
        avg_daily_hours = round(weekly_df.groupby("DateObj")["Hours"].sum().mean(), 1) if not weekly_df.empty else 0
    
        stats = {
            "total_hours_week": round(weekly_df["Hours"].sum()),
            "top_day": top_day,
            "top_day_hours": top_day_hours,
            "unique_employees": unique_employees,
            "total_shifts": total_shifts,
            "avg_daily_hours": avg_daily_hours,
            "rankings": {
                "weekly": list(
                    weekly_df.groupby("Name")["Hours"].sum().sort_values(ascending=False).astype(int).items()
                ),
                "period": list(
                    filtered_df[filtered_df["DateObj"].apply(get_pay_period) == current_pp]
                    .groupby("Name")["Hours"].sum().sort_values(ascending=False).astype(int).items()
                ),
                "total": list(
                    filtered_df.groupby("Name")["Hours"].sum().sort_values(ascending=False).astype(int).items()
                )
            }
        }

    # === Shift Swaps
    if "swaps" in steps:
        stats["swaps"] = swaps_all

    if DEBUG_MODE:
        print(f"[DEBUG] Finished processing. Total shifts: {len(df)}")

    if return_df:
        return output_files, stats, df, raw_codes
    return output_files, stats
