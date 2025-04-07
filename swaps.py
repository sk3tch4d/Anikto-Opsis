import re
from collections import defaultdict

def parse_exceptions_section(text, current_date):
    lines = text.splitlines()
    swaps = []
    off_records = []

    for line in lines:
        if "Off:" in line and "-" in line:
            match = re.search(r"Off:\s+(.+?)\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})\s+(.*?)\s", line)
            if match:
                name = match.group(1).strip()
                start, end = match.group(2), match.group(3)
                reason = match.group(4)
                off_records.append({"name": name, "start": start, "end": end, "reason": reason})

        if "On:" in line and "Covering" in line:
            match = re.search(r"On:\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}).*?On:\s+(.+?)\s+(\d{2}:\d{2})", line)
            if match:
                start, end = match.group(1), match.group(2)
                name = match.group(3).strip()
                # Match with corresponding "Off"
                for off in off_records:
                    if off["start"] == start and off["end"] == end:
                        swaps.append({
                            "date": current_date.strftime("%Y-%m-%d"),
                            "off": off["name"],
                            "on": name,
                            "time": f"{start}-{end}",
                            "reason": off["reason"]
                        })
                        off_records.remove(off)
                        break
    return swaps
