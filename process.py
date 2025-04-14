
import re
import os 
import pdfplumber 
import pandas as pd
from dataclasses import dataclass 
from datetime import datetime, timedelta 
from models import db, Employee, ShiftRecord, CoverageShift 

@dataclass class ShiftData: full_name: str date: datetime start: str end: str shift: str shift_type: str day_type: str hours: float source_pdf: str file_date: datetime is_coverage: bool = False coverage_pair: tuple[str, str] | None = None  # (original_name, covering_name) reason: str | None = None

def extract_shift_info(line, current_date): matches = re.findall(r'\b(SA\d|od\d+|OE|\w{1,3}\d{2,4}|\d{3,4})\b', line, re.IGNORECASE) results = [] day_type = "Weekend" if current_date.weekday() >= 5 else "Weekday"

for m in matches:
    if re.match(r'^SA\d$', m, re.IGNORECASE):
        results.append((m, "Day", day_type))
    elif re.match(r'^od\d+', m, re.IGNORECASE) or m.upper() == "OE":
        results.append((m, "Other", day_type))
    else:
        cleaned = re.sub(r'^[dDeEnwW]', '', m)
        if cleaned.isdigit() and len(cleaned) == 4:
            continue
        if re.match(r'^[dD]', m):
            results.append((cleaned, "Day", day_type))
        elif re.match(r'^[eE]', m):
            results.append((cleaned, "Evening", day_type))
        elif re.match(r'^[nN]', m):
            results.append((cleaned, "Night", day_type))
        else:
            results.append((cleaned, "Other", day_type))

return results

def parse_pdf_to_shiftdata(pdf_path): records = [] coverage_entries = [] file_date = None base_name = os.path.basename(pdf_path)

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        text = page.extract_text() or ""
        lines = text.splitlines()

        for line in lines:
            if "Inventory Services" in line:
                try:
                    file_date = datetime.strptime(line.split()[-1], "%d/%b/%Y").date()
                except ValueError:
                    continue
                break

        for line in lines:
            if any(x in line for x in ["Off:", "On Call", "Relief"]):
                continue
            tokens = line.strip().split()
            if len(tokens) < 5:
                continue
            try:
                start_time = tokens[-4]
                end_time = tokens[-3]
                full_name = f"{tokens[-2].rstrip(',')} {tokens[-1]}"  # First Last
                shift_info = extract_shift_info(line, file_date)
                if not shift_info:
                    continue

                dt_start = datetime.strptime(f"{file_date} {start_time}", "%Y-%m-%d %H:%M")
                dt_end = datetime.strptime(f"{file_date} {end_time}", "%Y-%m-%d %H:%M")
                if dt_end <= dt_start:
                    dt_end += timedelta(days=1)
                hours = round((dt_end - dt_start).seconds / 3600, 1)

                shift_str = " ".join([s[0] for s in shift_info])
                shift_type = shift_info[0][1]
                day_type = shift_info[0][2]

                record = ShiftData(
                    full_name=full_name,
                    date=file_date,
                    start=start_time,
                    end=end_time,
                    shift=shift_str,
                    shift_type=shift_type,
                    day_type=day_type,
                    hours=hours,
                    source_pdf=base_name,
                    file_date=file_date
                )
                records.append(record)
            except Exception:
                continue

        if file_date and "Exceptions Day Unit:" in text:
            in_exceptions = False
            for i, line in enumerate(lines):
                if "Exceptions Day Unit:" in line:
                    in_exceptions = True
                    continue
                if in_exceptions:
                    match = re.match(r'(.*?,\s*\w+)\s*\u2192\s*(.*?,\s*\w+)', line)
                    if match:
                        coverer = match.group(1).strip()
                        original = match.group(2).strip()
                        reason = lines[i + 1].strip() if i + 1 < len(lines) else None
                        coverage_entries.append((original, coverer, reason))

for original, coverer, reason in coverage_entries:
    for r in records:
        if r.full_name == coverer:
            r.is_coverage = True
            r.coverage_pair = (original, coverer)
            r.reason = reason

return records

def insert_shiftdata_to_db(shift_data): if not shift_data: return "No data extracted."

file_date = shift_data[0].file_date
latest = db.session.query(ShiftRecord.file_date).order_by(ShiftRecord.file_date.desc()).first()

if latest and file_date <= latest[0]:
    return f"Skipping insert: {file_date} is older than latest file date {latest[0]}"

inserted = 0
for record in shift_data:
    try:
        first, last = record.full_name.strip().split(" ", 1)
    except ValueError:
        continue
    employee = Employee.query.filter_by(first_name=first, last_name=last).first()
    if not employee:
        employee = Employee(first_name=first, last_name=last, status="Pending")
        db.session.add(employee)
        db.session.flush()

    shift = ShiftRecord(
        employee_id=employee.id,
        date=record.date,
        shift=record.shift,
        start=record.start,
        end=record.end,
        type=record.shift_type,
        hours=record.hours,
        day_type=record.day_type,
        file_date=record.file_date,
        source_pdf=record.source_pdf,
        is_coverage=record.is_coverage
    )
    db.session.add(shift)
    inserted += 1

    if record.coverage_pair:
        try:
            orig_first, orig_last = record.coverage_pair[0].strip().split(" ", 1)
        except ValueError:
            continue
        org_emp = Employee.query.filter_by(first_name=orig_first, last_name=orig_last).first()
        if not org_emp:
            org_emp = Employee(first_name=orig_first, last_name=orig_last, status="Pending")
            db.session.add(org_emp)
            db.session.flush()

        coverage = CoverageShift(
            date=record.date,
            shift=record.shift,
            start=record.start,
            end=record.end,
            type=record.shift_type,
            hours=record.hours,
            file_date=record.file_date,
            org_employee_id=org_emp.id,
            cov_employee_id=employee.id,
            reason=record.reason,
            source_pdf=record.source_pdf
        )
        db.session.add(coverage)

db.session.commit()
return f"Inserted {inserted} new shifts from {record.source_pdf} (file date: {file_date})"

