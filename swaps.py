# ==============================
# SWAPS.PY
# ==============================

import os
import re
import json

# ==============================
# LOAD JSON LIST
# ==============================
def load_all_employees():
    base = os.path.join(os.path.dirname(__file__), "static")
    with open(os.path.join(base, "emp_ft.json"), "r") as f1, open(os.path.join(base, "emp_pt.json"), "r") as f2:
        ft = json.load(f1)
        pt = json.load(f2)
    return list(set(ft + pt))

EMP_ALL = load_all_employees()

# ==============================
# NORMALIZE NAME
# ==============================
def normalize_name(name):
    parts = [p.strip() for p in name.split(",")]
    if len(parts) == 2:
        return f"{parts[1]} {parts[0]}"
    return name.strip()

# ==============================
# CLEAN SWAP REASON
# ==============================
def clean_reason_text(reason_raw):
    r = reason_raw.lower()
    if "swap" in r:
        return "Shift Swap"
    if "sick" in r:
        return "Sick Leave"
    if "vacation" in r:
        return "Vacation"
    if "stat" in r:
        return "Stat Holiday"
    if "cancel" in r:
        return "Shift Cancellation"
    if "leave" in r:
        return "Leave of Absence"
    if "covering vacant" in r:
        return "Covering Vacant"
    if "orientation" in r:
        return "Orientation"
    if "adjustm" in r:
        return "Schedule Adjustment"
    if "banked stat" in r:
        return "Banked Stat"
    return "Other"

# ==============================
# EXTRACT RELIEF NAME
# ==============================
def extract_relief_name(line):
    match = re.search(r"Relief:\s*([A-Za-z\-\s']+),\s([A-Za-z\-\s']+)", line)
    if match:
        last, first = match.groups()
        return f"{last.strip()}, {first.strip()}"
    return None

# ==============================
# EXTRACT NAME FROM LINE
# ==============================
def extract_name_from_line(line):
    for name in EMP_ALL:
        if name in line:
            return name
    return None

# ==============================
# PARSE EXCEPTIONS SECTION
# ==============================
def parse_exceptions_section(text, schedule_df, file_name, file_date):
    lines = text.splitlines()
    sections = {"Day": [], "Evening": [], "Night": []}
    current = None

    for line in lines:
        if "Exceptions Day" in line:
            current = "Day"
        elif "Exceptions Evening" in line:
            current = "Evening"
        elif "Exceptions Night" in line:
            current = "Night"
        elif "Scheduled Shifts" in line:
            current = None
        elif current:
            sections[current].append(line.strip())

    all_swaps = []
    used_coverers = set()

    for shift_type, block in sections.items():
        off_lines = [l for l in block if l.startswith("Off:")]
        on_lines = [l for l in block if "On:" in l or "Relief:" in l]

        for off_line in off_lines:
            embedded_coverer = extract_relief_name(off_line)
            off_part = off_line.split("Relief:")[0].strip() if "Relief:" in off_line else off_line

            org_name = extract_name_from_line(off_part)
            if not org_name:
                continue

            time_matches = re.findall(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", off_line)
            if not time_matches:
                continue
            start, end = time_matches[0]
            time_str = f"{start} - {end}"

            reason_segment = off_line.split(time_str, 1)[-1].split("Relief:")[0].strip() if time_str in off_line else ""
            reason_tokens = reason_segment.strip().split()
            suffix = reason_tokens[-1].upper() if reason_tokens and reason_tokens[-1].upper() in {"N", "P", "PN", "C"} else ""
            reason_text = " ".join(reason_tokens).replace(suffix, "").strip() if suffix else " ".join(reason_tokens)

            if embedded_coverer:
                coverer = embedded_coverer
            else:
                coverer = "Vacant"
                for line in on_lines:
                    if start in line and end in line:
                        name = extract_name_from_line(line)
                        if name and name not in used_coverers:
                            coverer = name
                            used_coverers.add(name)
                            break

            scheduled_row = schedule_df[schedule_df["Name"] == coverer]
            if scheduled_row.empty:
                continue

            shift = scheduled_row["Shift"].values[0]
            actual_type = scheduled_row["Type"].values[0]
            day_type = scheduled_row["DayType"].values[0]

            all_swaps.append({
                "org_employee": normalize_name(org_name),
                "cov_employee": normalize_name(coverer),
                "start": start,
                "end": end,
                "date": str(file_date),
                "reason_raw": reason_text,
                "reason": clean_reason_text(reason_text),            
                "day_type": day_type.title(),
                "notes": suffix,
                "shift": f"d{shift.replace('d', '').replace('n', '')}",
                "org_type": actual_type
            })

    for line in on_lines:
        if "Covering Vacant" in line:
            name = extract_name_from_line(line)
            if not name or name in used_coverers:
                continue
            time_matches = re.findall(r"(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", line)
            if not time_matches:
                continue
            start, end = time_matches[0]
            suffix_match = re.findall(r"\b([NPCpnc]{1,2})\b", line)
            suffix = suffix_match[-1].upper() if suffix_match else ""
            scheduled_row = schedule_df[schedule_df["Name"] == name]
            if scheduled_row.empty:
                continue
            shift = scheduled_row["Shift"].values[0]
            actual_type = scheduled_row["Type"].values[0]
            day_type = scheduled_row["DayType"].values[0]
            used_coverers.add(name)
            all_swaps.append({
                "org_employee": "Vacant",
                "cov_employee": normalize_name(name),
                "start": start,
                "end": end,
                "date": str(file_date),
                "reason_raw": "Covering Vacant",
                "reason": "Covering Vacant",
                "type": actual_type.title(),
                "day_type": day_type.title(),
                "notes": suffix,
                "shift": f"d{shift.replace('d', '').replace('n', '')}"
            })

    return all_swaps
