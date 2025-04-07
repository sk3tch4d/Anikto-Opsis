
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
    relief_map = {}

    for i, line in enumerate(lines):
        if line.startswith("Off:"):
            name_match = re.search(r"Off:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if name_match:
                name = name_match.group(1).strip()
                start, end = name_match.group(2), name_match.group(3)
                reason = name_match.group(4).strip()
                off = {
                    "name": name,
                    "start": start,
                    "end": end,
                    "reason": reason
                }

                # Look for "Relief: Name" in reason
                relief_match = re.search(r"Relief:\s+([^\d]+)\s+(\d{2}:\d{2})", reason)
                if relief_match:
                    r_name = relief_match.group(1).strip()
                    off["relief_name"] = r_name
                    relief_map[name] = r_name

                off_blocks.append(off)

        elif line.startswith("On:") and "Covering" in line:
            name_match = re.search(r"On:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if name_match:
                name = name_match.group(1).strip()
                start, end = name_match.group(2), name_match.group(3)
                on_blocks.append({
                    "name": name,
                    "start": start,
                    "end": end
                })

    used_on = set()

    for off in off_blocks:
        emoji, reason_label = clean_reason(off["reason"])
        time_range = f"{off['start']} - {off['end']}"
        shift_emoji = get_day_emoji(off["start"])
        shift_id = "?"

        match_on = None

        # Try explicit relief match first
        if "relief_name" in off:
            for on in on_blocks:
                if on["name"] == off["relief_name"] and on["start"] == off["start"] and on["end"] == off["end"]:
                    match_on = on
                    break
        else:
            # Fallback to first unused matching on-block
            for on in on_blocks:
                if (on["start"], on["end"]) == (off["start"], off["end"]) and on["name"] not in used_on:
                    match_on = on
                    break

        if match_on:
            on_name = match_on["name"]
            start = match_on["start"]
            end = match_on["end"]
            used_on.add(on_name)

            if records_df is not None:
                record_match = records_df[
                    (records_df["Name"] == on_name) &
                    (records_df["DateObj"] == date) &
                    (records_df["Start"] == start) &
                    (records_df["End"] == end)
                ]
                if not record_match.empty:
                    shift_id = record_match.iloc[0]["Shift"]

            swaps.append({
                "date": date.strftime("%a, %b %d"),
                "shift": shift_id,
                "emoji": shift_emoji,
                "hours": time_range,
                "off": f"{emoji} {flip_name(off['name'])}",
                "on": f"🟢 {flip_name(match_on['name'])}",
                "reason": reason_label
            })

    return swaps
