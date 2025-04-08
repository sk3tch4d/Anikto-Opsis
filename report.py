
import os
import re
import pandas as pd
from datetime import datetime, timedelta
from collections import defaultdict

from argx import write_argx, make_pay_period_fn
#from heatmap import generate_heatmap_png
#from parser import parse_pdf

get_pay_period = make_pay_period_fn(datetime(2025, 1, 13))


def group_by_shift(df, target_date):
    shifts = defaultdict(list)

    for _, row in df.iterrows():
        start_time = datetime.strptime(row["Start"], "%H:%M").time()
        start_datetime = datetime.combine(row["DateObj"], start_time)

        if start_datetime.date() == target_date:
            shifts[row["Type"]].append((row["Name"], row["Shift"]))

    return dict(shifts)


def process_report(pdf_paths):
    frames_with_swaps = [parse_pdf(p) for p in pdf_paths]
    frames = [f[0] for f in frames_with_swaps]
    swaps_all = sum([f[1] for f in frames_with_swaps], [])

    file_date_map = {}
    for path in pdf_paths:
        match = re.search(r'(\d{4}-\d{2}-\d{2})', os.path.basename(path))
        if match:
            file_date_map[os.path.basename(path)] = pd.to_datetime(match.group(1))

    for frame, path in zip(frames, pdf_paths):
        fname = os.path.basename(path)
        frame["SourceFile"] = fname
        frame["FileDate"] = file_date_map.get(fname)

    df = pd.concat(frames, ignore_index=True)
    df = df.sort_values(by=["DateObj", "Shift", "FileDate"], ascending=[True, True, False])
    df = df.drop_duplicates(subset=["DateObj", "Shift"], keep="first")

    if df.empty:
        print("No data found.")
        return [], {}

    df["WeekStart"] = df["DateObj"].apply(lambda d: d - timedelta(days=d.weekday()))
    first_date = df["DateObj"].min().strftime("%Y-%m-%d")
    output_files = []

    output_filename = f"ARGX_{first_date}.xlsx"
    output_path = os.path.join("/tmp", output_filename)
    write_argx(df, output_path, get_pay_period)
    print(f"Saved: {output_path}")
    output_files.append(output_path)

    heatmap_path = generate_heatmap_png(df, first_date)
    output_files.append(heatmap_path)

    today = datetime.now().date()
    week_start = today - timedelta(days=today.weekday())
    current_period = get_pay_period(today)

    weekly_rankings = (
        df[df["WeekStart"] == week_start]
        .groupby("Name")["Hours"].sum()
        .sort_values(ascending=False)
        .astype(int)
        .items()
    )

    period_rankings = (
        df[df["DateObj"].apply(get_pay_period) == current_period]
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
        "working_today": group_by_shift(df, today),
        "working_tomorrow": group_by_shift(df, today + timedelta(days=1)),
        "total_hours_week": round(df[df["WeekStart"] == week_start]["Hours"].sum()),
        "top_day": df.groupby("DateObj")["Hours"].sum().idxmax(),
        "top_day_hours": int(df.groupby("DateObj")["Hours"].sum().max()),
        "rankings": {
            "weekly": list(weekly_rankings),
            "period": list(period_rankings),
            "total": list(total_rankings)
        },
        "swaps": swaps_all
    }

    return output_files, stats
