# ==============================
# PARSER.PY (Refactored)
# ==============================

import re
import os
import json
import pdfplumber
import pandas as pd
import logging
from datetime import datetime, timedelta
from swaps import parse_exceptions_section

# Setup logging
logging.basicConfig(level=logging.DEBUG, format='[%(levelname)s] %(message)s')

# ==============================
# LOAD NAMES FROM JSON
# ==============================
STATIC_DIR = os.path.join(os.path.dirname(__file__), 'static')
EMP_LIST_PATH = os.path.join(STATIC_DIR, 'emp_ext.json')
with open(EMP_LIST_PATH, 'r') as f:
    VALID_NAMES = set(" ".join(name.split()) for name in json.load(f))

# ==============================
# EXTRACT PROCESSING DATE
# ==============================
def extract_processing_date(lines):
    for line in lines:
        if "Unit: Inventory Services" in line:
            logging.debug(f"Date line found: {line}")
            match = re.search(r"(Mon|Tue|Wed|Thu|Fri|Sat|Sun),\s*\d{2}/[A-Za-z]{3}/\d{4}", line)
            if match:
                try:
                    return datetime.strptime(match.group(), "%a, %d/%b/%Y").date()
                except ValueError as e:
                    logging.warning(f"Date parsing failed: {e}")
    return None

# ==============================
# CHECK VALID SHIFT LINE
# ==============================
def is_valid_shift_line(line):
    return not any(x in line for x in ["Off:", "On Call", "Relief"]) and re.search(r'\d{2}:\d{2}.*\d{2}:\d{2}', line)

# ==============================
# EXTRACT NAME
# ==============================
def extract_name(line):
    name_match = re.search(r'([A-Za-z-]+,\s+[A-Za-z\s-]+)$', line)
    if name_match:
        return " ".join(name_match.group().split())
    return None

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
        shift_type = "Day"  # default
        explicitly_matched = False

        if re.match(r'^sa\d$', m_lower):
            shift_type = "Day"
            explicitly_matched = True
        elif re.match(r'^od\d+', m_lower) or m.upper() == "OE":
            shift_type = "Day"
            explicitly_matched = True
        elif m_lower in w_day:
            shift_type = "Day"
            explicitly_matched = True
        elif m_lower in w_evening:
            shift_type = "Evening"
            explicitly_matched = True
        elif m_lower in w_night:
            shift_type = "Night"
            explicitly_matched = True
        elif re.match(r'^[dD]', m):
            shift_type = "Day"
        elif re.match(r'^[eE]', m):
            shift_type = "Evening"
        elif re.match(r'^[nN]', m):
            shift_type = "Night"

        if not explicitly_matched and shift_type == "Day":
            logging.warning(f"Unrecognized shift code '{m}' in line: {line}")

        results.append({
            "code": m.strip().upper(),
            "type": shift_type,
            "DayType": day_type
        })

    return results

# ==============================
# BUILD RECORD
# ==============================
def build_record(line, processing_date):
    time_matches = re.findall(r'\d{2}:\d{2}', line)
    if len(time_matches) < 2:
        return None
    start_time, end_time = time_matches[:2]

    full_name = extract_name(line)
    if not full_name or full_name not in VALID_NAMES:
        return None

    infos = extract_shift_info(line, processing_date)
    if not infos:
        return None
    full_shift_id = " ".join(i["code"] for i in infos)
    shift_type = infos[0]["type"]
    day_type = infos[0]["DayType"]

    dt_start = datetime.strptime(f"{processing_date} {start_time}", "%Y-%m-%d %H:%M")
    dt_end = datetime.strptime(f"{processing_date} {end_time}", "%Y-%m-%d %H:%M")
    if dt_end <= dt_start:
        dt_end += timedelta(days=1)

    hours = round((dt_end - dt_start).seconds / 3600, 1)
    
    return {
        "Name":     full_name,
        "Date":     processing_date.strftime("%a, %b %d"),
        "DateObj":  processing_date,
        "Shift":    full_shift_id,
        "Type":     shift_type,
        "DayType":  day_type,
        "Hours":    hours,
        "Start":    start_time,
        "End":      end_time
    }
    
    logging.debug(f"Parsed: {full_name} — {full_shift_id} — {shift_type}")

# ==============================
# PARSE PDF
# ==============================
def parse_pdf(pdf_path, stop_on_date=None):
    records = []
    swaps = []

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            lines = text.splitlines()

            processing_date = extract_processing_date(lines)
            if not processing_date:
                continue

            for line in lines:
                if not is_valid_shift_line(line):
                    continue
                try:
                    record = build_record(line, processing_date)
                    if record:
                        records.append(record)
                except Exception as e:
                    logging.debug(f"Skipped line due to error: {e}")

            if not any(r["DateObj"] == processing_date for r in records):
                logging.debug(f"No valid shifts parsed for {processing_date}")

            if processing_date and "Exceptions Day Unit:" in text:
                swaps_found = parse_exceptions_section(
                    text,
                    pd.DataFrame(records),
                    os.path.basename(pdf_path),
                    processing_date
                )
                logging.info(f"SWAPS FOUND: {swaps_found}")
                swaps += swaps_found

            if stop_on_date and processing_date == stop_on_date:
                logging.debug(f"stop_on_date {stop_on_date} reached. Stopping processing.")
                return pd.DataFrame(records), swaps

    logging.debug(f"Total swaps found: {len(swaps)}")
    return pd.DataFrame(records), swaps
