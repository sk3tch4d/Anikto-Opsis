import os
import re
import pdfplumber
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict
from datetime import datetime, timedelta
from swaps import parse_exceptions_section
from argx import write_argx, make_pay_period_fn

# === Initialize Pay Period Function ===
get_pay_period = make_pay_period_fn(datetime(2025, 1, 13))

# === Constants ===
VALID_NAMES = {
    "Adeniyi, Oluwaseyi", "Bhardwaj, Liam", "Donovan, Patrick", "Gallivan, David",
    "Janaway, Alexander", "Robichaud, Richard", "Santo, Jaime", "Tobin, James",
    "Ukwesa, Jennifer", "Vanderputten, Richard", "Woodland, Nathaniel"
}

# === Core Helpers ===
def extract_shift_ids(line):
    return [t for t in line.split() if re.match(r'(SA[1-4]|[A-Z]*\d{3,4})$', t, re.IGNORECASE)]

def classify_shift(start, end, shift_ids):
    if "313" in shift_ids:
        return "Day"

    s = datetime.strptime(start, "%H:%M").time()

    if datetime.strptime("07:00", "%H:%M").time() <= s < datetime.strptime("11:00", "%H:%M").time():
        return "Day"
    if datetime.strptime("14:00", "%H:%M").time() <= s <= datetime.strptime("16:00", "%H:%M").time():
        return "Evening"
    if datetime.strptime("22:00", "%H:%M").time() <= s <= datetime.strptime("23:59", "%H:%M").time():
        return "Night"

    return "Other"

# === PDF Parser ===
def parse_pdf(pdf_path):
    records = []
    swaps = []
    current_date = None

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            lines = text.splitlines() if text else []

            for line in lines:
                if "Inventory Services" in line:
                    try:
                        current_date = datetime.strptime(line.split()[-1], "%d/%b/%Y").date()
                    except:
                        pass
                    break

            for line in lines:
                if any(x in line for x in ["Off:", "On Call", "Relief"]):
                    continue
                tokens = line.strip().split()
                if len(tokens) >= 5:
                    try:
                        start_time = tokens[-4]
                        end_time = tokens[-3]
                        full_name = f"{tokens[-2].rstrip(',')}, {tokens[-1]}"
                        if full_name not in VALID_NAMES:
                            continue
                        shift_ids = extract_shift_ids(line)
                        full_shift_id = " ".join(shift_ids).strip()
                        dt_start = datetime.strptime(f"{current_date} {start_time}", "%Y-%m-%d %H:%M")
                        dt_end = datetime.strptime(f"{current_date} {end_time}", "%Y-%m-%d %H:%M")
                        if dt_end <= dt_start:
                            dt_end += timedelta(days=1)
                        hours = round((dt_end - dt_start).seconds / 3600, 1)
                        shift_type = classify_shift(start_time, end_time, shift_ids)
                        records.append({
                            "Name": full_name,
                            "Date": current_date.strftime("%a, %b %d"),
                            "DateObj": current_date,
                            "Shift": full_shift_id,
                            "Type": shift_type,
                            "Hours": hours,
                            "Start": start_time,
                            "End": end_time
                        })
                    except:
                        continue

            if current_date and "Exceptions Day Unit:" in text:
                swaps += parse_exceptions_section(text, current_date, pd.DataFrame(records))

    return pd.DataFrame(records), swaps

# === Excel Writer ===
def generate_argx_from_pdfs(pdf_paths, output_xlsx, log_duplicates=True):
    frames = [parse_pdf(p) for p in pdf_paths]
    df = pd.concat(frames, ignore_index=True)

    print(f"Total parsed rows: {len(df)}")
    print(f"PDF paths: {pdf_paths}")

    if df.empty:
        print("No data found.")
        return None

    if log_duplicates:
        dups = df[df.duplicated(subset=["Name", "DateObj", "Shift"], keep="first")]
        if not dups.empty:
            dups.to_excel("ARGX_DroppedDuplicates_Log.xlsx", index=False)

    df = df.drop_duplicates(subset=["Name", "DateObj", "Shift"])
    write_argx(df, output_xlsx, get_pay_period)
    print(f"Saved: {output_xlsx}")
    return output_xlsx

# === Generate ARGM ===
def generate_heatmap_png(df, date_label):
    df["WeekStart"] = df["DateObj"].apply(lambda d: d - timedelta(days=d.weekday()))

    pivot = df.pivot_table(index="Name", columns="WeekStart", values="Hours", aggfunc="sum", fill_value=0)
    pivot = pivot.round(0).astype(int)
    plt.figure(figsize=(10, 6))
    sns.heatmap(pivot, annot=True, fmt="d", cmap="Blues")
    path = f"/tmp/ARGM_{date_label}.png"
    plt.title("Weekly Hours per Person")
    plt.tight_layout()
    plt.savefig(path)
    plt.close()
    print(f"Saved heatmap: {path}")
    return path

# === Generator ===
def generate_argx_and_heatmap(pdf_paths):
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
    raw_df_for_swaps = df.copy()

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

def group_by_shift(df, target_date):
    shifts = defaultdict(list)

    for _, row in df.iterrows():
        start_time = datetime.strptime(row["Start"], "%H:%M").time()
        start_datetime = datetime.combine(row["DateObj"], start_time)

        if start_datetime.date() == target_date:
            shifts[row["Type"]].append((row["Name"], row["Shift"]))

    return dict(shifts)
