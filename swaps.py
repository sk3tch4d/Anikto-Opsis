import re
from datetime import datetime
from collections import defaultdict

REASON_CATEGORIES = {
    "sick": "🔵",
    "vacation": "🟠",
    "adjustment": "🟣",
    "bereavement": "⚫",
    "shift swap": "🔴",
    "banked stat": "🟤",
    "vacant": "⚪",
    "assoc. bus-pd re": "🔴",
    "per ab unpd": "⚫"
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

    # Extract Off and On lines
    for i, line in enumerate(lines):
        if line.startswith("Off:"):
            name_match = re.search(r"Off:\s+([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if name_match:
                off_blocks.append({
                    "name": name_match.group(1).strip(),
                    "start": name_match.group(2),
                    "end": name_match.group(3),
                    "reason": name_match.group(4).strip()
                })
        elif line.startswith("On:") and "Covering" in line:
            name_match = re.search(r"On:.*?Covering Vacant.*?On: ([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if name_match:
                on_blocks.append({
                    "name": name_match.group(1).strip(),
                    "start": name_match.group(2),
                    "end": name_match.group(3)
                })
            else:
                # fallback if regex fails
                parts = line.split("On:")
                for part in parts:
                    sub_match = re.search(r"([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", part)
                    if sub_match:
                        on_blocks.append({
                            "name": sub_match.group(1).strip(),
                            "start": sub_match.group(2),
                            "end": sub_match.group(3)
                        })

    for i in range(max(len(off_blocks), len(on_blocks))):
        off = off_blocks[i] if i < len(off_blocks) else None
        on = on_blocks[i] if i < len(on_blocks) else None

        # check off only
        if off and not on:
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
        # check on only
        elif on and not off:
            swaps.append({
                "date": date.strftime("%a, %b %d"),
                "shift": "?",
                "emoji": get_day_emoji(on["start"]),
                "hours": f"{on['start']} - {on['end']}",
                "off": "⚪ Vacant Shift",
                "on": f"🟢 {flip_name(on['name'])}",
                "reason": "Vacant"
            })
        # paired
        elif on and off:
            # if same person, likely false match
            if flip_name(on["name"]) == flip_name(off["name"]):
                continue
            emoji, reason_label = clean_reason(off["reason"])
            shift_id = "?"
            if records_df is not None:
                match = records_df[
                    (records_df["Name"] == flip_name(on["name"])) &
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

    return swaps