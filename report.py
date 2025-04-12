# process_report.py
import os
import re
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict

from argx import write_argx, make_pay_period_fn
from heatmap import generate_heatmap_png
from parser import parse_pdf

# Pay‐period helper
get_pay_period = make_pay_period_fn(datetime(2025, 1, 13))

def group_by_shift(df, target_date):
    shifts = defaultdict(list)
    shift_types = ['Day', 'Evening', 'Night']  # Define expected categories

    for _, row in df.iterrows():
        row_date = row.get("DateObj")
        if row_date != target_date:
            continue

        # Parse time safely (in case Start is empty or bad)
        try:
            shift_time = datetime.strptime(str(row["Start"]), "%H:%M").time()
        except (ValueError, TypeError):
            shift_time = None

        shift_name = row.get("Shift", "Unknown")
        full_name = row.get("Employee", "Unknown")

        shift_category = shift_name if shift_name in shift_types else "Other"

        shifts[shift_category].append((full_name, row.get("Start", "?")))

    return shifts

def get_working_on_date(df, date_str):
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return {"error": "Invalid date format. Use YYYY-MM-DD"}

    # Normalize all dates in df
    df['DateObj'] = pd.to_datetime(df['date'], errors='coerce').dt.date

    return group_by_shift(df, target_date)

def process_report(pdf_paths, return_df=False):
    # Parse each PDF
    frames_with_swaps = [parse_pdf(p) for p in pdf_paths]
    frames = [f[0] for f in frames_with_swaps]
    swaps_all = sum((f[1] for f in frames_with_swaps), [])

    # Map file → date
    file_date_map = {}
    for path in pdf_paths:
        match = re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(path))
        if match:
            file_date_map[os.path.basename(path)] = pd.to_datetime(match.group(1))

    # Tag each frame
    for frame, path in zip(frames, pdf_paths):
        fname = os.path.basename(path)
        frame["SourceFile"] = fname
        frame["FileDate"]   = file_date_map.get(fname)

    # Consolidate & dedupe
    df = pd.concat(frames, ignore_index=True)
    df = df.sort_values(by=["DateObj", "Shift", "FileDate"], ascending=[True, True, False])
    df = df.drop_duplicates(subset=["DateObj", "Shift"], keep="first")

    if df.empty:
        print("No data found.")
        return [], {}

    # Add week‐start
    df["WeekStart"] = df["DateObj"].apply(lambda d: d - timedelta(days=d.weekday()))
    first_date = df["DateObj"].min().strftime("%Y-%m-%d")

    # Write ARGX Excel
    output_filename = f"ARGX_{first_date}.xlsx"
    output_path = os.path.join("/tmp", output_filename)
    write_argx(df, output_path, get_pay_period)
    print(f"Saved: {output_path}")

    # Generate heatmap
    heatmap_path = generate_heatmap_png(df, first_date)

    # Rankings
    today       = datetime.now().date()
    week_start  = today - timedelta(days=today.weekday())
    current_pp  = get_pay_period(today)

    weekly_rankings = (
        df[df["WeekStart"] == week_start]
        .groupby("Name")["Hours"].sum()
        .sort_values(ascending=False)
        .astype(int)
        .items()
    )
    period_rankings = (
        df[df["DateObj"].apply(get_pay_period) == current_pp]
        .groupby("Name")["Hours"].sum()
        .sort_values(ascending=False)
        .astype(int)
        .items()
    )
    total_rankings = (
        df.groupby("Name")["Hours"]
        .sum()
        .sort_values(ascending=False)
        .astype(int)
        .items()
    )

    stats = {
        "working_today":    group_by_shift(df, today),
        "working_tomorrow": group_by_shift(df, today + timedelta(days=1)),
        "total_hours_week": round(df[df["WeekStart"] == week_start]["Hours"].sum()),
        "top_day":          df.groupby("DateObj")["Hours"].sum().idxmax(),
        "top_day_hours":    int(df.groupby("DateObj")["Hours"].sum().max()),
        "rankings": {
            "weekly": list(weekly_rankings),
            "period": list(period_rankings),
            "total":  list(total_rankings),
        },
        "swaps": swaps_all
    }

    output_files = [output_path, heatmap_path]
    if return_df:
        return output_files, stats, df
    return output_files, stats
