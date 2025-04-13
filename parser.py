
import re
import os
import json
import pdfplumber
import pandas as pd
from datetime import datetime, timedelta
from swaps import parse_exceptions_section

# === Load Names from JSON ===
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
EMP_LIST_PATH = os.path.join(STATIC_DIR, 'emp_ext.json')
with open(EMP_LIST_PATH, 'r') as f:
    VALID_NAMES = set(json.load(f))

# === Helpers ===
def extract_shift_info(line, processing_date):
    matches = re.findall(r'\b(SA\d|od\d+|OE|\w{1,3}\d{2,4}|\d{3,4})\b', line, re.IGNORECASE)
    results = []
    is_weekend = processing_date.weekday() >= 5
    day_type = "Weekend" if is_weekend else "Weekday"

    for m in matches:
        if re.match(r'^SA\d$', m, re.IGNORECASE):
            results.append({"id": m, "type": "Day", "DayType": day_type})
            continue
        if re.match(r'^od\d+', m, re.IGNORECASE) or m.upper() == "OE":
            results.append({"id": m, "type": "Other", "DayType": day_type})
            continue

        cleaned = re.sub(r'^[dDeEnwW]', '', m)
        if cleaned.isdigit() and len(cleaned) == 4:
            continue

        if re.match(r'^[dD]', m):
            shift_type = "Day"
        elif re.match(r'^[eE]', m):
            shift_type = "Evening"
        elif re.match(r'^[nN]', m):
            shift_type = "Night"
        else:
            shift_type = "Other"

        results.append({"id": cleaned, "type": shift_type, "DayType": day_type})

    return results

# === PDF Parser ===
def parse_pdf(pdf_path, stop_on_date=None):
    records = []
    swaps = []
    processing_date = None

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            lines = text.splitlines()

            for line in lines:
                if "Inventory Services" in line:
                    print("[DEBUG] Date line found:", line)
                    try:
                        processing_date = datetime.strptime(line.split()[-1], "%d/%b/%Y").date()
                        print("[DEBUG] Parsed processing_date:", processing_date)
                        ## Check if processing_date matches stop_on_date
                        if stop_on_date and processing_date == stop_on_date:
                            print(f"[DEBUG] stop_on_date {stop_on_date} reached. Stopping processing.")
                            return pd.DataFrame(records), swaps
                        ##
                    except ValueError as e:
                        print("[ERROR] Date parsing failed:", e)
                    break

            for line in lines:
                if any(x in line for x in ["Off:", "On Call", "Relief"]):
                    continue

                tokens = line.strip().split()
                if len(tokens) < 5:
                    continue

                try:
                    start_time = tokens[-4]
                    end_time   = tokens[-3]
                    full_name  = f"{tokens[-2].rstrip(',')}, {tokens[-1]}"
                    if full_name not in VALID_NAMES:
                        continue

                    infos = extract_shift_info(line, processing_date)
                    if not infos:
                        continue

                    full_shift_id = " ".join(i["id"] for i in infos)
                    shift_type    = infos[0]["type"]
                    day_type      = infos[0]["DayType"]

                    dt_start = datetime.strptime(f"{processing_date} {start_time}", "%Y-%m-%d %H:%M")
                    dt_end   = datetime.strptime(f"{processing_date} {end_time}",   "%Y-%m-%d %H:%M")
                    if dt_end <= dt_start:
                        dt_end += timedelta(days=1)

                    hours = round((dt_end - dt_start).seconds / 3600, 1)

                    records.append({
                        "Name":     full_name,
                        "Date":     processing_date.strftime("%a, %b %d"),
                        "DateObj":  processing_date,
                        "Shift":    full_shift_id,
                        "Type":     shift_type,
                        "DayType":  day_type,
                        "Hours":    hours,
                        "Start":    start_time,
                        "End":      end_time
                    })

                except Exception:
                    continue

            if processing_date and "Exceptions Day Unit:" in text:
                from swaps import parse_exceptions_section
                swaps_found = parse_exceptions_section(
                    text,
                    pd.DataFrame(records),
                    os.path.basename(pdf_path),
                    processing_date
                )
                print("SWAPS FOUND:", swaps_found)
                swaps += swaps_found
    
    print("[DEBUG] Total swaps found:", len(swaps))
    
    return pd.DataFrame(records), swaps
