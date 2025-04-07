
import re
from datetime import datetime
from collections import defaultdict

REASON_CATEGORIES = {
    "sick": "🔵",
    "vacation": "🟠",
    "adjustment": "🟣",
    "bereavement": "⚫",
    "shift swap": "🔴",
}

def clean_reason(reason):
    reason = reason.lower().replace("continued", "").replace("adjustm", "adjustment").strip()
    for key in REASON_CATEGORIES:
        if key in reason:
            return REASON_CATEGORIES[key], key.title()
    return "🔴", reason.title()

def flip_name(name):
    parts = name.split(",")
    return f"{parts[1].strip()} {parts[0].strip()}" if len(parts) == 2 else name

def get_day_emoji(start):
    try:
        hour = int(start.split(":")[0])
        if 6 <= hour < 14:
            return "☀️"
        elif 14 <= hour < 22:
            return "🌆"
        else:
            return "🌙"
    except:
        return "❓"

def parse_exceptions_section(text, date, records_df=None):
    swaps = []
    lines = text.splitlines()
    off_blocks = []
    on_blocks = []

    for i, line in enumerate(lines):
        if line.startswith("Off:"):
            name_match = re.search(r"Off:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if name_match:
                name = name_match.group(1).strip()
                start, end = name_match.group(2), name_match.group(3)
                reason = name_match.group(4).strip()
                off_blocks.append({
                    "name": name,
                    "start": start,
                    "end": end,
                    "reason": reason
                })

        elif line.startswith("On:"):
            name_match = re.search(r"On:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if name_match:
                name = name_match.group(1).strip()
                start, end = name_match.group(2), name_match.group(3)
                on_blocks.append({
                    "name": name,
                    "start": start,
                    "end": end,
                    "line": line.lower(),
                    "is_vacant": "vacant" in line.lower()
                })

    used_ons = set()
    for off in off_blocks:
        match = None
        for i, on in enumerate(on_blocks):
            if i in used_ons:
                continue
            if on["is_vacant"]:
                continue
            if on["start"] == off["start"] and on["end"] == off["end"]:
                match = on
                used_ons.add(i)
                break

        emoji, reason_label = clean_reason(off["reason"])
        time_range = f"{off['start']} - {off['end']}"
        shift_id = "?"
        shift_emoji = get_day_emoji(off["start"])

        if match:
            on_name = match["name"]
            if records_df is not None:
                rec_match = records_df[
                    (records_df["Name"] == on_name) &
                    (records_df["DateObj"] == date) &
                    (records_df["Start"] == match["start"]) &
                    (records_df["End"] == match["end"])
                ]
                if not rec_match.empty:
                    shift_id = rec_match.iloc[0]["Shift"]
            swaps.append({
                "date": date.strftime("%a, %b %d"),
                "shift": shift_id,
                "emoji": shift_emoji,
                "hours": time_range,
                "off": f"{emoji} {flip_name(off['name'])}",
                "on": f"🟢 {flip_name(match['name'])}",
                "reason": reason_label
            })

    for i, on in enumerate(on_blocks):
        if on["is_vacant"] and i not in used_ons:
            shift_id = "?"
            if records_df is not None:
                rec_match = records_df[
                    (records_df["Name"] == on["name"]) &
                    (records_df["DateObj"] == date) &
                    (records_df["Start"] == on["start"]) &
                    (records_df["End"] == on["end"])
                ]
                if not rec_match.empty:
                    shift_id = rec_match.iloc[0]["Shift"]
            time_range = f"{on['start']} - {on['end']}"
            shift_emoji = get_day_emoji(on["start"])
            swaps.append({
                "date": date.strftime("%a, %b %d"),
                "shift": shift_id,
                "emoji": shift_emoji,
                "hours": time_range,
                "off": "⚪ Vacant Shift",
                "on": f"🟢 {flip_name(on['name'])}",
                "reason": ""
            })

    return swaps
