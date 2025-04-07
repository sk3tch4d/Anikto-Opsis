import re
from datetime import datetime

# Emoji per reason type (fallback is red)
REASON_EMOJI = {
    "Sick": "🔵",
    "Vacation": "🟠",
    "Personal": "🟣",
    "Emergency": "🔴",
    "Training": "🟡",
    "Meeting": "🟡",
    "Bereavement": "⚫",
    "Adjustment": "🟤",
}

SHIFT_EMOJI = {
    "day": "☀️",
    "evening": "🌆",
    "night": "🌙",
    "unknown": "❓"
}

def normalize_name(name):
    parts = name.replace(",", "").split()
    if len(parts) >= 2:
        return f"{parts[1]} {parts[0]}"
    return name.strip()

def parse_exceptions_section(text, current_date):
    lines = text.splitlines()
    off_records = []
    on_records = []

    for line in lines:
        if "Off:" in line:
            m = re.search(r"Off:\s*(.*?)(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})(.*?)$", line)
            if m:
                name = normalize_name(m.group(1).strip())
                start, end = m.group(2), m.group(3)
                note = m.group(4).strip()
                note = note.replace("Continued", "").replace("Schedule Adjustm", "Adjustment").strip(" []:")
                off_records.append({
                    "name": name,
                    "start": start,
                    "end": end,
                    "reason": note or "Unknown",
                    "date": current_date.strftime("%a, %b %d"),
                })
        elif "On:" in line:
            m = re.search(r"On:\s*(.*?)(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})", line)
            if m:
                name = normalize_name(m.group(1).strip())
                start, end = m.group(2), m.group(3)
                on_records.append({
                    "name": name,
                    "start": start,
                    "end": end,
                })

    swaps = []
    used_ons = set()

    for off in off_records:
        # Find a matching on-record with same shift time and not used
        match = next((on for on in on_records if on["start"] == off["start"] and on["end"] == off["end"]
                      and (on["start"], on["end"]) not in used_ons), None)
        if match:
            used_ons.add((match["start"], match["end"]))

            # Determine shift label for emoji
            hour = int(off["start"].split(":")[0])
            if 6 <= hour < 12:
                shift_icon = SHIFT_EMOJI["day"]
            elif 14 <= hour < 18:
                shift_icon = SHIFT_EMOJI["evening"]
            elif 22 <= hour <= 23 or 0 <= hour < 6:
                shift_icon = SHIFT_EMOJI["night"]
            else:
                shift_icon = SHIFT_EMOJI["unknown"]

            reason_icon = REASON_EMOJI.get(off["reason"], "🔴")

            swaps.append({
                "date": f"{shift_icon} {off['date']}: ?",
                "time": f"{off['start']} - {off['end']}",
                "off": f"{reason_icon} {off['name']}",
                "on": f"🟢 {match['name']}",
                "reason": off["reason"]
            })

    return swaps