import re
from datetime import datetime

def clean_reason(text):
    text = text.replace("Continued", "").replace("Schedule Adjustm", "Adjustment").strip()
    return re.sub(r"[\[\]]", "", text)

def parse_exceptions_section(text, date_obj):
    lines = text.splitlines()
    swaps = []
    current_off = None
    off_time = None
    shift = None
    time = None
    on_found = False

    for line in lines:
        if line.startswith("Off:"):
            match = re.search(r"Off:\s+([^\d]+)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.+)", line)
            if match:
                name_raw, start, end, reason = match.groups()
                current_off = name_raw.strip().replace(",", "")
                off_time = f"{start} - {end}"
                shift = None
                time = f"{start} - {end}"
                reason = clean_reason(reason)
                on_found = False
                swaps.append({
                    "date": date_obj.strftime("%a, %b %d"),
                    "shift": "?",
                    "time": time,
                    "off": current_off,
                    "on": None,
                    "reason": reason
                })

        elif line.startswith("On:") and current_off and not on_found:
            match = re.search(r"On:\s+(.*?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            shift_match = re.search(r"([A-Z]+\d{3,4})", line)
            if match:
                name_raw, start, end = match.groups()
                on_person = name_raw.strip().replace(",", "")
                if swaps:
                    swaps[-1]["on"] = on_person
                    if shift_match:
                        swaps[-1]["shift"] = shift_match.group(1)
                on_found = True

    # Format swap objects for display
    formatted_swaps = []
    for s in swaps:
        emoji = "☀️" if "07:00" in s["time"] else "🌙"
        off_icon = "🔴"
        on_icon = "🟢"
        formatted_swaps.append({
            "date": f"{emoji} {s['date']}: {s['shift']}",
            "time": s["time"],
            "off": f"{off_icon} {s['off']}",
            "on": f"{on_icon} {s['on']} {s['time']}" if s["on"] else "?",
            "reason": clean_reason(s["reason"])
        })

    return formatted_swaps