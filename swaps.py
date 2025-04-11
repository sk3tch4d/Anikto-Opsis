
import re
from datetime import datetime

# === Emoji helper (legacy UI support only) ===
REASON_EMOJIS = {
    "Sick Leave": "💊",
    "Vacation": "🌴",
    "Shift Cancellation": "❌",
    "Stat Holiday": "⭐",
    "Leave of Absence": "✈️",
    "Other": "🔁",
}

def normalize_name(name):
    parts = [p.strip() for p in name.split(",")]
    if len(parts) == 2:
        return f"{parts[1]} {parts[0]}"
    return name.strip()

def parse_exceptions_section(text, schedule_df, file_name, file_date):
    swaps = []
    if "Exceptions Day Unit:" not in text:
        print(f"[DEBUG] No 'Exceptions Day Unit:' found in {file_name}")
        return swaps

    lines = text.splitlines()
    start = next((i for i, line in enumerate(lines) if "Exceptions Day Unit:" in line), -1)
    if start == -1:
        print(f"[DEBUG] Could not locate 'Exceptions Day Unit:' in lines of {file_name}")
        return swaps

    block = lines[start:]
    off_blocks = [l for l in block if l.strip().startswith("Off:")]
    on_blocks  = [l for l in block if l.strip().startswith("On:")]
    print(f"[DEBUG] {file_name} — Found {len(off_blocks)} Off blocks, {len(on_blocks)} On blocks")

    for off in off_blocks:
        try:
            off_line = off.replace("Off:", "").strip()
            print(f"[DEBUG] Processing Off line: {off_line}")
            name_match = re.match(r"([A-Za-z\-\s']+),\s([A-Za-z\-\s']+)", off_line)
            if not name_match:
                print(f"[WARN] Name match failed: {off_line}")
                continue

            last, first = name_match.groups()
            org_full_name = f"{first} {last}"

            time_match = re.search(r"(\d{2}:\d{2})\s-\s(\d{2}:\d{2})", off_line)
            start_time, end_time = ("UNKNOWN", "UNKNOWN")
            if time_match:
                start_time, end_time = time_match.groups()

            raw_reason = off_line.split(end_time)[-1].strip() if end_time != "UNKNOWN" else ""
            reason, notes = clean_reason(raw_reason)

            match_row = schedule_df[schedule_df["Name"].str.contains(last) & schedule_df["Name"].str.contains(first)]
            if match_row.empty:
                print(f"[WARN] No schedule match for: {org_full_name}")
            shift = match_row["Shift"].iloc[0] if not match_row.empty else "UNKNOWN"
            hours = match_row["Hours"].iloc[0] if not match_row.empty else 0.0
            shift_type = match_row["Type"].iloc[0] if not match_row.empty else "Other"
            day_type = match_row["DayType"].iloc[0] if not match_row.empty else "Weekday"

            coverer = find_coverer_candidate(on_blocks, shift)
            print(f"[DEBUG] Parsed swap: {org_full_name} -> {coverer}, shift={shift}, reason={reason}")

            swaps.append({
                "date": str(file_date),
                "shift": shift,
                "start": start_time,
                "end": end_time,
                "type": shift_type,
                "day_type": day_type,
                "hours": hours,
                "org_employee": org_full_name,
                "cov_employee": coverer,
                "reason": reason,
                "reason_raw": raw_reason,
                "notes": notes,
                "emoji": REASON_EMOJIS.get(reason, "")
            })
        except Exception as e:
            print(f"[ERROR] Exception parsing off line: {off} — {e}")
            continue

    return swaps

def clean_reason(raw):
    raw = raw.strip()
    if not raw:
        return ("Other", "")
    r = raw.lower()
    if "sick" in r:
        return ("Sick Leave", format_notes(raw))
    if "vacation" in r:
        return ("Vacation", format_notes(raw))
    if "stat" in r:
        return ("Stat Holiday", format_notes(raw))
    if "cancel" in r:
        return ("Shift Cancellation", format_notes(raw))
    if "leave" in r:
        return ("Leave of Absence", format_notes(raw))
    return ("Other", format_notes(raw))

def format_notes(raw):
    words = raw.split()
    suffix = words[-1] if words else ""
    if suffix.lower() in ["n", "pn", "p", "c"]:
        return f"{' '.join(words[:-1]).title()} - {suffix.upper()}"
    return raw.title()

def find_coverer_candidate(on_blocks, shift_hint):
    for line in on_blocks:
        if shift_hint and shift_hint in line:
            name_match = re.search(r"On:\s(\d{2}:\d{2})\s-\s(\d{2}:\d{2})\s.*?([A-Za-z-\s']+),\s([A-Za-z-\s']+)", line)
            if name_match:
                _, _, last, first = name_match.groups()
                return f"{first} {last}"
    return "Vacant"
