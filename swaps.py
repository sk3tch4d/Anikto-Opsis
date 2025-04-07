import re
from datetime import datetime

# Maps reason keywords to icons
REASON_ICONS = {
    "sick": "🔵",
    "vacation": "🟠",
    "schedule": "🟣",
    "adjustm": "🟣",
    "personal": "🟡",
    "training": "🟤",
    "union": "⚫",
    "bereavement": "⚰️",
}

# Maps hour windows to shift emojis
def shift_icon(start):
    try:
        hour = int(start.split(":")[0])
        if 6 <= hour < 14:
            return "☀️"  # Day
        elif 14 <= hour < 22:
            return "🌆"  # Evening
        else:
            return "🌙"  # Night
    except:
        return "❓"

def to_name_format(raw_name):
    parts = raw_name.strip().split(",")
    if len(parts) == 2:
        return f"{parts[1].strip()} {parts[0].strip()}"
    return raw_name.strip()

def parse_exceptions_section(text, current_date):
    swaps = []
    date_str = current_date.strftime("%a, %b %-d") if hasattr(current_date, 'strftime') else str(current_date)

    # Capture lines in the Exceptions block
    lines = text.splitlines()
    block = []
    in_block = False
    for line in lines:
        if "Exceptions Day Unit" in line:
            in_block = True
            continue
        if in_block and line.strip() == "":
            break
        if in_block:
            block.append(line)

    off_info = None
    for line in block:
        if line.startswith("Off:"):
            match = re.match(r"Off: ([^\d]+) (\d{2}:\d{2}) - (\d{2}:\d{2}) (.+)", line)
            if match:
                name = to_name_format(match.group(1))
                start = match.group(2)
                end = match.group(3)
                note = match.group(4)
                icon = "🔴"
                for k, v in REASON_ICONS.items():
                    if k in note.lower():
                        icon = v
                        break
                off_info = {
                    "date": date_str,
                    "start": start,
                    "end": end,
                    "name": name,
                    "reason": note,
                    "off_icon": icon,
                    "shift": "",  # Filled when coverage found
                }

        elif line.startswith("On:") and "Covering Vacant" in line and off_info:
            time_match = re.search(r"(\d{2}:\d{2}) - (\d{2}:\d{2})", line)
            name_match = re.search(r"On: ([^\d]+) \d{2}:\d{2}", line)
            shift_match = re.search(r"([A-Z]{1}\d{3,4})", line)
            if time_match and name_match:
                on_name = to_name_format(name_match.group(1))
                start = time_match.group(1)
                end = time_match.group(2)
                shift_id = shift_match.group(1) if shift_match else "?"
                icon = shift_icon(start)
                swaps.append({
                    "icon": icon,
                    "date": off_info["date"],
                    "shift": shift_id,
                    "off_icon": off_info["off_icon"],
                    "off": off_info["name"],
                    "reason": off_info["reason"],
                    "on_icon": "🟢",
                    "on": on_name,
                    "time": f"{start} - {end}"
                })
                off_info = None  # Reset after match

    return swaps
