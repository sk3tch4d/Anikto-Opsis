import re
from datetime import datetime
from collections import defaultdict

REASON_CATEGORIES = {
    "sick": "🔵",
    "vacation": "🟠",
    "adjustment": "🟣",
    "bereavement": "⚫",
    "shift swap": "🔴",
    "banked": "🔴",
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
            match = re.search(r"Off:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if match:
                off_blocks.append({
                    "name": match.group(1).strip(),
                    "start": match.group(2),
                    "end": match.group(3),
                    "reason": match.group(4).strip(),
                    "raw": line,
                })

        elif line.startswith("On:"):
            if "Covering Vacant" in line:
                continue
            match = re.search(r"On:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if match:
                on_blocks.append({
                    "name": match.group(1).strip(),
                    "start": match.group(2),
                    "end": match.group(3),
                    "raw": line,
                })

    used_ons = set()
    for off in off_blocks:
        for idx, on in enumerate(on_blocks):
            key = (on["name"], on["start"], on["end"])
            if key in used_ons:
                continue
            if on["start"] == off["start"] and on["end"] == off["end"]:
                used_ons.add(key)
                emoji, reason_label = clean_reason(off["reason"])
                shift_id = "?"
                if records_df is not None:
                    match = records_df[
                        (records_df["Name"] == on["name"]) &
                        (records_df["DateObj"] == date) &
                        (records_df["Start"] == on["start"]) &
                        (records_df["End"] == on["end"])
                    ]
                    if not match.empty:
                        shift_id = match.iloc[0]["Shift"]

                swaps.append({
                    "date": date.strftime("%a, %b %d"),
                    "shift": shift_id,
                    "emoji": get_day_emoji(on["start"]),
                    "hours": f"{on['start']} - {on['end']}",
                    "off": f"{emoji} {flip_name(off['name'])}",
                    "on": f"🟢 {flip_name(on['name'])}",
                    "reason": reason_label
                })
                break
        else:
            # No one matched for the off shift
            emoji, reason_label = clean_reason(off["reason"])
            swaps.append({
                "date": date.strftime("%a, %b %d"),
                "shift": "?",
                "emoji": get_day_emoji(off["start"]),
                "hours": f"{off['start']} - {off['end']}",
                "off": f"{emoji} {flip_name(off['name'])}",
                "on": "⚪ Vacant Shift",
                "reason": reason_label
            })

    return swaps