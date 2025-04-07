
import re
from datetime import datetime
from collections import defaultdict

def normalize_name(name):
    if "," in name:
        last, first = name.split(",", 1)
        return f"{first.strip()} {last.strip()}"
    return name.strip()

def classify_shift_emoji(start_time):
    try:
        hour = int(start_time.split(":")[0])
        if 6 <= hour < 14:
            return "☀️"
        elif 14 <= hour < 22:
            return "🌆"
        else:
            return "🌙"
    except:
        return "❓"

def clean_reason(reason):
    reason = re.sub(r"\bcontinued\b", "", reason, flags=re.IGNORECASE)
    reason = re.sub(r"\bschedule adjustm\b", "Adjustment", reason, flags=re.IGNORECASE)
    return reason.strip()

def parse_exceptions_section(text, current_date):
    swaps = []
    lines = text.splitlines()
    off_records = []
    on_records = []

    for line in lines:
        if line.startswith("Off:"):
            off_records.append(line)
        elif line.startswith("On:"):
            on_records.append(line)

    used_on = set()

    for off in off_records:
        match = re.match(r"Off:\s+(.*?),\s+(.*?)\s+(\d{2}:\d{2})\s+-\s+(\d{2}:\d{2})\s+(.*)", off)
        if match:
            last, first, start, end, reason = match.groups()
            off_name = normalize_name(f"{last}, {first}")
            reason = clean_reason(reason)
            matched_on = None
            for idx, on in enumerate(on_records):
                if idx in used_on:
                    continue
                if f"{start} - {end}" in on:
                    name_match = re.search(r"On:.*?(?::\s+)?(.*?),\s+(.*?)\s+\d{2}:\d{2}\s+-\s+\d{2}:\d{2}", on)
                    if name_match:
                        o_last, o_first = name_match.groups()
                        on_name = normalize_name(f"{o_last}, {o_first}")
                        matched_on = (on_name, start, end)
                        used_on.add(idx)
                        break
            if matched_on:
                emoji = classify_shift_emoji(start)
                swaps.append({
                    "date": current_date.strftime("%a, %b %d"),
                    "shift": "?",  # You may update this from context if available
                    "off": f"🔴 {off_name}",
                    "on": f"{emoji} {matched_on[1]} - {matched_on[2]}\n🟢 {matched_on[0]}",
                    "reason": reason
                })

    return swaps
