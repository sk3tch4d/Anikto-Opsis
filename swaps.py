import re
from datetime import datetime
from collections import defaultdict

REASON_CATEGORIES = {
    "sick": "🔵",
    "vacation": "🟠",
    "adjustment": "🟣",
    "bereavement": "⚫",
    "shift swap": "🔴",
    "banked": "🟤",
    "unpaid": "⚫",
    "vacant": "⚪",
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

    # Gather OFF and ON entries
    for line in lines:
        if line.startswith("Off:"):
            m = re.search(r"Off:\s+(.+?)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s+(.*)", line)
            if m:
                off_blocks.append({
                    "name": m.group(1).strip(),
                    "start": m.group(2),
                    "end": m.group(3),
                    "reason": m.group(4).strip()
                })
        elif line.startswith("On:") and "Covering" in line:
            m = re.search(r"On:.*?([A-Za-z ,.'-]+)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", line)
            if m:
                on_blocks.append({
                    "name": m.group(1).strip(),
                    "start": m.group(2),
                    "end": m.group(3)
                })

    max_len = max(len(off_blocks), len(on_blocks))
    for i in range(max_len):
        off = off_blocks[i] if i < len(off_blocks) else None
        on = on_blocks[i] if i < len(on_blocks) else None

        shift_id = "?"
        start = on["start"] if on else (off["start"] if off else "00:00")
        end = on["end"] if on else (off["end"] if off else "00:00")
        shift_emoji = get_day_emoji(start)
        time_range = f"{start} - {end}"
        reason_label = "Vacant"
        emoji = "⚪"

        if off:
            emoji, reason_label = clean_reason(off["reason"])
        if on and off and flip_name(on["name"]) == flip_name(off["name"]):
            continue  # skip self-coverage

        if records_df is not None:
            matched = records_df[
                (records_df["DateObj"] == date) &
                (records_df["Start"] == start) &
                (records_df["End"] == end)
            ]
            if on:
                matched = matched[matched["Name"].str.contains(on["name"].split()[0], case=False, na=False)]
            if not matched.empty:
                shift_id = matched.iloc[0]["Shift"]

        swaps.append({
            "date": date.strftime("%a, %b %d"),
            "shift": shift_id,
            "emoji": shift_emoji,
            "hours": time_range,
            "off": f"{emoji} {flip_name(off['name'])}" if off else "⚪ Vacant Shift",
            "on": f"🟢 {flip_name(on['name'])}" if on else "⚪ Vacant Shift",
            "reason": reason_label
        })

    return swaps