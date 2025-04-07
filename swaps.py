
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

def parse_exceptions_section(text, date_obj, records_df=None):
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

    used_off = set()
    for on in on_blocks:
        on_name = on["name"]
        start = on["start"]
        end = on["end"]
        shift_emoji = get_day_emoji(start)

        # Match to valid shift from parsed data
        shift_id = "?"
        if records_df is not None:
            match = records_df[
                (records_df["Name"] == on_name) &
                (records_df["DateObj"] == date_obj) &
                (records_df["Start"] == start) &
                (records_df["End"] == end)
            ]
            if not match.empty:
                shift_id = match.iloc[0]["Shift"]

        # Skip if we can't resolve a shift
        if shift_id == "?":
            continue

        # Try matching an off block
        off = None
        for i, block in enumerate(off_blocks):
            if (block["start"], block["end"]) == (start, end) and i not in used_off:
                off = block
                used_off.add(i)
                break

        if off:
            if flip_name(off["name"]) == flip_name(on_name):
                continue  # prevent same person covering themselves

            emoji, reason_label = clean_reason(off["reason"])
            swaps.append({
                "date": date_obj.strftime("%a, %b %d"),
                "shift": shift_id,
                "emoji": shift_emoji,
                "hours": f"{start} - {end}",
                "off": f"{emoji} {flip_name(off['name'])}",
                "on": f"🟢 {flip_name(on_name)}",
                "reason": reason_label
            })
        else:
            # No one off, treat as vacant shift
            swaps.append({
                "date": date_obj.strftime("%a, %b %d"),
                "shift": shift_id,
                "emoji": shift_emoji,
                "hours": f"{start} - {end}",
                "off": "⚪ Vacant Shift",
                "on": f"🟢 {flip_name(on_name)}",
                "reason": ""
            })

    return swaps
