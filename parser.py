# ==============================
# PARSER.PY
# ==============================

import re
import os
import json
import fitz  # PyMuPDF
import pandas as pd
from datetime import datetime, timedelta
from swaps import parse_exceptions_section

# ==============================
# LOAD NAMES FROM JSON
# ==============================
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
EMP_LIST_PATH = os.path.join(STATIC_DIR, 'emp_ext.json')
with open(EMP_LIST_PATH, 'r') as f:
    VALID_NAMES = set(json.load(f))

# ==============================
# EXTRACT SHIFT INFO
# ==============================
def extract_shift_info(line, processing_date):
    matches = re.findall(r'\b(SA\d|od\d+|OE|\w{1,3}\d{2,4}|\d{3,4})\b', line, re.IGNORECASE)
    results = []
    is_weekend = processing_date.weekday() >= 5
    day_type = "Weekend" if is_weekend else "Weekday"

    w_day = {"w406", "w408", "w409", "w503", "w504", "w507", "w401", "w502"}
    w_evening = {"w505", "w508"}
    w_night = {"w501", "w506"}

    for m in matches:
        m_lower = m.lower()

        if re.match(r'^sa\d$', m_lower):
            shift_type = "Day"
        elif re.match(r'^od\d+', m_lower) or m.upper() == "OE":
            shift_type = "Day"
        elif m_lower in w_day:
            shift_type = "Day"
        elif m_lower in w_evening:
            shift_type = "Evening"
        elif m_lower in w_night:
            shift_type = "Night"
        elif re.match(r'^[dD]', m):
            shift_type = "Day"
        elif re.match(r'^[eE]', m):
            shift_type = "Evening"
        elif re.match(r'^[nN]', m):
            shift_type = "Night"
        else:
            shift_type = "Day"

        cleaned = re.sub(r'^[dDeEnwW]', '', m)
        results.append({
            "id": cleaned,
            "type": shift_type,
            "DayType": day_type
        })

    return results

# ==============================
# PARSE PDF
# ==============================
def parse_pdf(pdf_path, stop_on_date=None):
    records = []
    swaps = []
    processing_date = None

    doc = fitz.open(pdf_path)
    for page in doc:
        text = page.get_text()
        lines = text.splitlines()

        for line in lines:
            if "Unit: Inventory Services" in line:
                print("[PARSER] Date line found:", line)
                match = re.search(r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*\d{2}/[A-Za-z]{3}/\d{4}", line)
                if match:
                    try:
                        processing_date = datetime.strptime(match.group(), "%a, %d/%b/%Y").date()
                        print("[PARSER] Parsed processing_date:", processing_date)
                    except ValueError as e:
                        print("[PARSER] Date parsing failed:", e)
                else:
                    print("[PARSER] Warning: No valid date found.")
                break

        if not processing_date:
            continue

        for line in lines:
            if any(x in line for x in ["Off:", "On Call", "Relief"]):
                continue
            if not re.search(r'\d{2}:\d{2}.*\d{2}:\d{2}', line):
                continue

            try:
                time_matches = re.findall(r'\d{2}:\d{2}', line)
                if len(time_matches) < 2:
                    continue
                start_time, end_time = time_matches[:2]

                name_match = re.search(r'([A-Za-z-]+,\s+[A-Za-z-]+)$', line)
                if not name_match:
                    continue
                full_name = name_match.group()
                if full_name not in VALID_NAMES:
                    continue

                infos = extract_shift_info(line, processing_date)
                if not infos:
                    continue

                full_shift_id = " ".join(i["id"] for i in infos)
                shift_type = infos[0]["type"]
                day_type = infos[0]["DayType"]

                dt_start = datetime.strptime(f"{processing_date} {start_time}", "%Y-%m-%d %H:%M")
                dt_end = datetime.strptime(f"{processing_date} {end_time}", "%Y-%m-%d %H:%M")
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

        if not any(r["DateObj"] == processing_date for r in records):
            print(f"[DEBUG] No valid shifts parsed for {processing_date}")

        if processing_date and "Exceptions Day Unit:" in text:
            swaps_found = parse_exceptions_section(
                text,
                pd.DataFrame(records),
                os.path.basename(pdf_path),
                processing_date
            )
            print("SWAPS FOUND:", swaps_found)
            swaps += swaps_found

        if stop_on_date and processing_date == stop_on_date:
            print(f"[DEBUG] stop_on_date {stop_on_date} reached. Stopping processing.")
            return pd.DataFrame(records), swaps

    print("[DEBUG] Total swaps found:", len(swaps))
    return pd.DataFrame(records), swaps
