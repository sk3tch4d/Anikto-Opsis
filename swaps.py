
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
    reason = reason.lower().replace("continued", "").replace("adjustm", "adjustment")
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

def parse_exceptions_section(text, date_obj):
    swaps = []
    lines = text.splitlines()
    current_shift = "?"
    current_start = ""
    current_end = ""
    off_name = None
    reason = ""
    coverage_line = ""
    on_name = None

    for i, line in enumerate(lines):
        if line.startswith("Off:"):
            match = re.search(r"Off:\s+(.*)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", line)
            if match:
                off_name = flip_name(match.group(1))
                current_start = match.group(2)
                current_end = match.group(3)
                reason = match.group(4)

        elif "Covering Vacant" in line or "C On:" in line:
            match = re.search(r"(?:C On:)?\s*(.*)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})", line)
            if match:
                on_name = flip_name(match.group(1))
                start = match.group(2)
                end = match.group(3)

                if off_name and on_name:
                    emoji, cleaned_reason = clean_reason(reason)
                    swaps.append({
                        "date": date_obj.strftime("%a, %b %d"),
                        "shift": current_shift,
                        "start": current_start,
                        "end": current_end,
                        "emoji": get_day_emoji(current_start),
                        "off": off_name,
                        "on": on_name,
                        "reason": cleaned_reason,
                        "reason_emoji": emoji
                    })

                    # Reset
                    off_name = None
                    on_name = None

    return swaps
