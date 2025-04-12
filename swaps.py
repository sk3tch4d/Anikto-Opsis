import re
import json

with open("static/emp_all.json", "r") as f:
    EMP_ALL = json.load(f)

def clean_reason_text(reason_raw):
    r = reason_raw.lower()
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
    return "Other"

def extract_relief_name(line):
    match = re.search(r"Relief:\s*([A-Za-z\-\s']+),\s([A-Za-z\-\s']+)", line)
    if match:
        last, first = match.groups()
        return f"{last.strip()}, {first.strip()}"
    return None

def extract_name_from_line(line):
    for name in EMP_ALL:
        if name in line:
            return name
    return None

def parse_exceptions_section(text, schedule_df, file_name, file_date):
    lines = text.splitlines()
    sections = {"Day": [], "Evening": [], "Night": []}
    current = None

    for line in lines:
        if "Exceptions Day Unit:" in line:
            current = "Day"
        elif "Exceptions Evening Unit:" in line:
            current = "Evening"
        elif "Exceptions Night Unit:" in line:
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
                "org_employee": org_name,
                "cov_employee": coverer,
                "start": start,
                "end": end,
                "date": str(file_date),
                "reason_raw": reason_text,
                "reason": clean_reason_text(reason_text),
            "shift_type": actual_type,
            "day_type": day_type,
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
                    "off": "Vacant",
                    "on": name,
                    "start": start,
                    "end": end,
                    "date": str(file_date),
                    "reason_raw": "Covering Vacant",
                    "reason": "Covering Vacant",
            "shift_type": actual_type,
            "day_type": day_type,
                    "notes": suffix,
                    "shift": f"d{shift.replace('d', '').replace('n', '')}",
                    "org_type": actual_type
                })

    return all_swaps