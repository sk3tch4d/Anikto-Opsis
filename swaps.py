import re
from datetime import datetime
from collections import defaultdict

REASON_CATEGORIES = {
    "sick": "🔵",
    "vacation": "🟠",
    "adjustment": "🟣",
    "bereavement": "⚫",
    "shift swap": "🔴",
    "banked": "🔴"
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

    for line in lines:
        if line.startswith("Off:"):
            match = re.search(r"Off:\s+([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if match:
                off_blocks.append({
                    "name": match.group(1).strip(),
                    "start": match.group(2),
                    "end": match.group(3),
                    "reason": match.group(4).strip()
                })
        elif "Covering" in line and "On:" in line:
            match = re.search(r"On:\s+([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if match:
                on_blocks.append({
                    "name": match.group(1).strip(),
                    "start": match.group(2),
                    "end": match.group(3)
                })

    for off, on in zip(off_blocks, on_blocks):
        if flip_name(off["name"]) == flip_name(on["name"]):
            continue  # skip if covering own shift

        on_name = on["name"]
        start = on["start"]
        end = on["end"]
        shift_id = "?"
        if records_df is not None:
            match = records_df[
                (records_df["Name"].str.contains(on_name.strip(), case=False)) &
                (records_df["DateObj"] == date) &
                (records_df["Start"] == start) &
                (records_df["End"] == end)
            ]
            if not match.empty:
                shift_id = match.iloc[0]["Shift"]
            else:
                continue  # skip if no confirmed match

        emoji, reason_label = clean_reason(off["reason"])
        shift_emoji = get_day_emoji(on["start"])
        time_range = f"{on['start']} - {on['end']}"

        swaps.append({
            "date": date.strftime("%a, %b %d"),
            "shift": shift_id,
            "emoji": shift_emoji,
            "hours": time_range,
            "off": f"{emoji} {flip_name(off['name'])}",
            "on": f"🟢 {flip_name(on['name'])}",
            "reason": reason_label
        })

    return swaps