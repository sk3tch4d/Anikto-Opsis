
import re
import pdfplumber
import pandas as pd
from datetime import datetime, timedelta
from swaps import parse_exceptions_section

# === Constants ===
VALID_NAMES = {
    "Adeniyi, Oluwaseyi", "Bhardwaj, Liam", "Donovan, Patrick", "Gallivan, David",
    "Janaway, Alexander", "Robichaud, Richard", "Santo, Jaime", "Tobin, James",
    "Ukwesa, Jennifer", "Vanderputten, Richard", "Woodland, Nathaniel"
}

# === Helpers ===
def extract_shift_ids(line):
    return [t for t in line.split() if re.match(r'(SA[1-4]|[A-Z]*\d{3,4})$', t, re.IGNORECASE)]

def classify_shift(start, end, shift_ids):
    if "313" in shift_ids:
        return "Day"

    s = datetime.strptime(start, "%H:%M").time()

    if datetime.strptime("07:00", "%H:%M").time() <= s < datetime.strptime("11:00", "%H:%M").time():
        return "Day"
    if datetime.strptime("14:00", "%H:%M").time() <= s <= datetime.strptime("16:00", "%H:%M").time():
        return "Evening"
    if datetime.strptime("22:00", "%H:%M").time() <= s <= datetime.strptime("23:59", "%H:%M").time():
        return "Night"

    return "Other"

# === PDF Parser ===
def parse_pdf(pdf_path):
    records = []
    swaps = []
    current_date = None

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            lines = text.splitlines() if text else []

            for line in lines:
                if "Inventory Services" in line:
                    try:
                        current_date = datetime.strptime(line.split()[-1], "%d/%b/%Y").date()
                    except:
                        pass
                    break

            for line in lines:
                if any(x in line for x in ["Off:", "On Call", "Relief"]):
                    continue
                tokens = line.strip().split()
                if len(tokens) >= 5:
                    try:
                        start_time = tokens[-4]
                        end_time = tokens[-3]
                        full_name = f"{tokens[-2].rstrip(',')}, {tokens[-1]}"
                        if full_name not in VALID_NAMES:
                            continue
                        shift_ids = extract_shift_ids(line)
                        full_shift_id = " ".join(shift_ids).strip()
                        dt_start = datetime.strptime(f"{current_date} {start_time}", "%Y-%m-%d %H:%M")
                        dt_end = datetime.strptime(f"{current_date} {end_time}", "%Y-%m-%d %H:%M")
                        if dt_end <= dt_start:
                            dt_end += timedelta(days=1)
                        hours = round((dt_end - dt_start).seconds / 3600, 1)
                        shift_type = classify_shift(start_time, end_time, shift_ids)
                        records.append({
                            "Name": full_name,
                            "Date": current_date.strftime("%a, %b %d"),
                            "DateObj": current_date,
                            "Shift": full_shift_id,
                            "Type": shift_type,
                            "Hours": hours,
                            "Start": start_time,
                            "End": end_time
                        })
                    except:
                        continue

            if current_date and "Exceptions Day Unit:" in text:
                swaps += parse_exceptions_section(text, current_date, pd.DataFrame(records))

    return pd.DataFrame(records), swaps
