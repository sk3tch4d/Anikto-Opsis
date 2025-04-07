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

    for line in lines:
        if line.startswith("Off:"):
            m = re.search(r"Off:\s+([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if m:
                off_blocks.append({
                    "name": m.group(1).strip(),
                    "start": m.group(2),
                    "end": m.group(3),
                    "reason": m.group(4).strip()
                })
        elif "Covering Vacant" in line and "On:" in line:
            m = re.search(r"On:\s+([^\d]+?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if m:
                on_blocks.append({
                    "name": m.group(1).strip(),
                    "start": m.group(2),
                    "end": m.group(3)
                })

    used_ons = set()

    for off in off_blocks:
        match_found = False
        for i, on in enumerate(on_blocks):
            on_key = (on['name'], on['start'], on['end'])
            if on_key in used_ons:
                continue
            if off["start"] == on["start"] and off["end"] == on["end"]:
                used_ons.add(on_key)
                emoji, reason_label = clean_reason(off["reason"])
                time_range = f"{on['start']} - {on['end']}"
                shift_id = "?"
                shift_emoji = get_day_emoji(on["start"])
                if records_df is not None:
                    try:
                        match = records_df[
                            (records_df["Name"].str.strip().str.lower() == on["name"].strip().lower()) &
                            (records_df["DateObj"] == date) &
                            (records_df["Start"] == on["start"]) &
                            (records_df["End"] == on["end"])
                        ]
                        if not match.empty:
                            shift_id = match.iloc[0]["Shift"]
                    except Exception:
                        pass
                swaps.append({
                    "date": date.strftime("%a, %b %d"),
                    "shift": shift_id,
                    "emoji": shift_emoji,
                    "hours": time_range,
                    "off": f"{emoji} {flip_name(off['name'])}",
                    "on": f"🟢 {flip_name(on['name'])}",
                    "reason": reason_label
                })
                match_found = True
                break
        if not match_found:
            emoji, reason_label = clean_reason(off["reason"])
            time_range = f"{off['start']} - {off['end']}"
            shift_emoji = get_day_emoji(off["start"])
            swaps.append({
                "date": date.strftime("%a, %b %d"),
                "shift": "?",
                "emoji": shift_emoji,
                "hours": time_range,
                "off": f"{emoji} {flip_name(off['name'])}",
                "on": f"⚪ Vacant Shift",
                "reason": reason_label
            })

    for on in on_blocks:
        on_key = (on['name'], on['start'], on['end'])
        if on_key in used_ons:
            continue
        time_range = f"{on['start']} - {on['end']}"
        shift_emoji = get_day_emoji(on["start"])
        shift_id = "?"
        if records_df is not None:
            try:
                match = records_df[
                    (records_df["Name"].str.strip().str.lower() == on["name"].strip().lower()) &
                    (records_df["DateObj"] == date) &
                    (records_df["Start"] == on["start"]) &
                    (records_df["End"] == on["end"])
                ]
                if not match.empty:
                    shift_id = match.iloc[0]["Shift"]
            except Exception:
                pass
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