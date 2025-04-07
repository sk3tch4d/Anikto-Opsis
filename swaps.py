
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

    for line in lines:
        if line.startswith("Off:"):
            name_match = re.search(r"Off:\s+([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if name_match:
                name = name_match.group(1).strip()
                start, end = name_match.group(2), name_match.group(3)
                reason = re.sub(r"Covering.*", "", name_match.group(4)).strip()
                off_blocks.append({
                    "name": name,
                    "start": start,
                    "end": end,
                    "reason": reason
                })

        elif line.startswith("On:") and "Covering" in line:
            name_match = re.search(r"On:\s+(?:Covering\s+)?[^:]*:?\s*([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if name_match:
                name = name_match.group(1).strip().rstrip(",")
                start, end = name_match.group(2), name_match.group(3)
                on_blocks.append({
                    "name": name,
                    "start": start,
                    "end": end
                })

    # Match on/off pairs
    for off in off_blocks:
        match_found = False
        for i, on in enumerate(on_blocks):
            if off["start"] == on["start"] and off["end"] == on["end"]:
                match_found = True
                shift_id = "?"
                if records_df is not None:
                    match = records_df[
                        (records_df["Name"].str.lower() == on["name"].lower()) &
                        (records_df["DateObj"] == date_obj) &
                        (records_df["Start"] == on["start"]) &
                        (records_df["End"] == on["end"])
                    ]
                    if not match.empty:
                        shift_id = match.iloc[0]["Shift"]

                emoji, reason_label = clean_reason(off["reason"])
                shift_emoji = get_day_emoji(on["start"])
                time_range = f"{on['start']} - {on['end']}"

                swaps.append({
                    "date": date_obj.strftime("%a, %b %d"),
                    "shift": shift_id,
                    "emoji": shift_emoji,
                    "hours": time_range,
                    "off": f"{emoji} {flip_name(off['name'])}",
                    "on": f"🟢 {flip_name(on['name'])}",
                    "reason": reason_label
                })
                del on_blocks[i]
                break

        if not match_found:
            emoji, reason_label = clean_reason(off["reason"])
            shift_emoji = get_day_emoji(off["start"])
            time_range = f"{off['start']} - {off['end']}"
            swaps.append({
                "date": date_obj.strftime("%a, %b %d"),
                "shift": "?",
                "emoji": shift_emoji,
                "hours": time_range,
                "off": f"{emoji} {flip_name(off['name'])}",
                "on": f"⚪ Vacant Shift",
                "reason": reason_label
            })

    # Add leftover vacant shifts
    for on in on_blocks:
        shift_id = "?"
        if records_df is not None:
            match = records_df[
                (records_df["Name"].str.lower() == on["name"].lower()) &
                (records_df["DateObj"] == date_obj) &
                (records_df["Start"] == on["start"]) &
                (records_df["End"] == on["end"])
            ]
            if not match.empty:
                shift_id = match.iloc[0]["Shift"]

        shift_emoji = get_day_emoji(on["start"])
        time_range = f"{on['start']} - {on['end']}"
        swaps.append({
            "date": date_obj.strftime("%a, %b %d"),
            "shift": shift_id,
            "emoji": shift_emoji,
            "hours": time_range,
            "off": "⚪ Vacant Shift",
            "on": f"🟢 {flip_name(on['name'])}",
            "reason": "Vacant"
        })

    return swaps

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

    for i in range(min(len(off_blocks), len(on_blocks))):
        off = off_blocks[i]
        on = on_blocks[i]

        emoji, reason_label = clean_reason(off["reason"])
        time_range = f"{on['start']} - {on['end']}"
        shift_id = "?"  # Shift ID unknown from exception section alone
        shift_emoji = get_day_emoji(on["start"])

        swaps.append({
            "date": date_obj.strftime("%a, %b %d"),
            "shift": shift_id,
            "time": f"{shift_emoji} {time_range}",
            "off": f"{emoji} {flip_name(off['name'])}",
            "on": f"🟢 {flip_name(on['name'])}",
            "reason": reason_label
        })

    return swaps
