
from datetime import datetime, timedelta
import re
import os

def clean_reason(reason_raw):
    if not reason_raw:
        return None
    reason_raw = reason_raw.lower()
    if "sick" in reason_raw:
        return "Sick Leave"
    if "vacation" in reason_raw:
        return "Vacation"
    if "cancel" in reason_raw:
        return "Shift Cancellation"
    if "training" in reason_raw:
        return "Training"
    if "bereavement" in reason_raw:
        return "Bereavement"
    return reason_raw.title()

def extract_notes(reason_raw, reason_clean, prefix=None):
    if not reason_raw:
        return ""
    raw_tokens = reason_raw.split()
    clean_tokens = set(reason_clean.lower().split()) if reason_clean else set()
    word_tokens = []
    code_tokens = []

    for t in raw_tokens:
        t_lower = t.lower()
        if t_lower in clean_tokens:
            continue
        if t_lower == "continued":
            word_tokens.append("Continued")
        elif t_lower == "new":
            word_tokens.append("New")
        elif t_lower == "paid":
            word_tokens.append("Paid")
        elif t.isalpha() and len(t) <= 2:
            code_tokens.append(t.upper())

    note_parts = []
    if prefix:
        note_parts.append(prefix)
    if word_tokens:
        note_parts.append(" ".join(word_tokens))
    if code_tokens:
        note_parts.append(" ".join(code_tokens))

    return " - ".join(note_parts).strip()

def normalize_name(name):
    if "," in name:
        last, first = [x.strip() for x in name.split(",", 1)]
        return f"{first} {last}"
    return name.strip()

def classify_type(start_time):
    h = int(start_time.split(":")[0])
    if h < 14:
        return "Day"
    if h < 22:
        return "Evening"
    return "Night"


def parse_exceptions_section(text, schedule_df, file_name, file_date):
    from .parser_helpers import extract_swap_lines  # if needed
    lines = text.splitlines()
    swaps_raw = []
    for line in lines:
        if "Off:" in line or "On:" in line or "Relief:" in line or "Covering Vacant" in line:
            # crude filter — mimic original extractor
            start_time = re.search(r"(\d{2}:\d{2})", line)
            if not start_time:
                continue
            swaps_raw.append({
                "original": "Vacant" if "Covering Vacant" in line else "UNKNOWN",
                "coverer": "UNKNOWN",
                "start": start_time.group(1),
                "end": "UNKNOWN",
                "reason": None,
                "reason_raw": line,
                "notes": line
            })
    # Fake fallback until raw swap parsing is re-wired properly
    return parse_exceptions_section_internal(swaps_raw, schedule_df, file_name, file_date)

def parse_exceptions_section_internal(swaps_raw, schedule_df, file_name, file_date):

    shift_records = []
    for swap in swaps_raw:
        norm_original = normalize_name(swap["original"])
        norm_coverer = normalize_name(swap["coverer"])
        shift_id = get_shift_id_for(norm_coverer, file_date, schedule_df)

        start_time = datetime.strptime(swap["start"], "%H:%M")
        if swap["end"] == "UNKNOWN": continue
    end_time = datetime.strptime(swap["end"], "%H:%M")
        if end_time <= start_time:
            end_time += timedelta(days=1)
        hours = round((end_time - start_time).seconds / 3600, 1)

        shift_records.append({
            "date": file_date,
            "start": swap["start"],
            "end": swap["end"],
            "shift": shift_id,
            "type": classify_type(swap["start"]),
            "day_type": "Weekend" if file_date.weekday() >= 5 else "Weekday",
            "hours": hours,
            "original": norm_original,
            "coverer": norm_coverer,
            "reason": None if norm_original == "Vacant" else swap.get("reason"),
            "reason_raw": None if norm_original == "Vacant" else swap.get("reason_raw"),
            "notes": swap.get("notes"),
            "source_pdf": os.path.splitext(file_name)[0],
            "file_date": file_date
        })
    return shift_records

def get_shift_id_for(name, date_obj, df):
    norm = normalize_name(name)
    row = df[(df["Name"] == norm) & (df["DateObj"] == date_obj)]
    if not row.empty:
        return row.iloc[0]["Shift"]
    return None
