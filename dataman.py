# \\\\\\ DATA MANAGEMENT \\\\\\ #

import json
import csv
from io import StringIO
from flask import Response, jsonify, request
from models import db, ShiftRecord, CoverageShift
from datetime import datetime


# //// Import JSON //// #
def import_shifts_from_json():
    try:
        data = request.get_json()

        # Track how many were added
        added_shift_records = 0
        added_coverage_shifts = 0

        for r in data.get("shift_records", []):
            shift = ShiftRecord(
                name=r["name"],
                date=datetime.fromisoformat(r["date"]).date(),
                shift=r["shift"],
                start=r["start"],
                end=r["end"],
                type=r["type"],
                hours=float(r["hours"]),
                is_coverage=r.get("is_coverage", False),
                source_pdf=r.get("source_pdf"),
                notes=r.get("notes")
            )
            db.session.add(shift)
            added_shift_records += 1

        for c in data.get("coverage_shifts", []):
            coverage = CoverageShift(
                date=datetime.fromisoformat(c["date"]).date(),
                shift=c["shift"],
                start=c["start"],
                end=c["end"],
                hours=float(c["hours"]),
                org_name=c["org_name"],
                cov_name=c["cov_name"],
                reason=c.get("reason"),
                shift_type=c.get("shift_type"),
                source_pdf=c.get("source_pdf"),
                notes=c.get("notes"),
                shift_record_id=c.get("shift_record_id")
            )
            db.session.add(coverage)
            added_coverage_shifts += 1

        db.session.commit()

        print(f"[JSON Import] Imported {added_shift_records} ShiftRecord(s) and {added_coverage_shifts} CoverageShift(s).")
        
        return jsonify({
            "message": "Import successful",
            "shift_records_added": added_shift_records,
            "coverage_shifts_added": added_coverage_shifts
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

# //// Import CSV //// #
def import_shifts_from_csv():
    try:
        file = request.files.get("file")
        if not file:
            return jsonify({"error": "No CSV file uploaded."}), 400

        stream = StringIO(file.stream.read().decode("utf-8"))
        reader = csv.reader(stream)

        mode = None
        added_shift_records = 0
        added_coverage_shifts = 0

        for row in reader:
            # Skip empty lines
            if not row or all(col.strip() == "" for col in row):
                continue

            # Detect section headers
            if "ShiftRecord Table" in row[0]:
                mode = "shift"
                next(reader)  # Skip header row
                continue
            elif "CoverageShift Table" in row[0]:
                mode = "coverage"
                next(reader)  # Skip header row
                continue

            if mode == "shift":
                shift = ShiftRecord(
                    name=row[1],
                    date=datetime.fromisoformat(row[2]).date(),
                    shift=row[3],
                    start=row[4],
                    end=row[5],
                    type=row[6],
                    hours=float(row[7]),
                    is_coverage=row[8].lower() == "true",
                    source_pdf=row[9],
                    created_at=datetime.fromisoformat(row[10]) if row[10] else None,
                    modified_at=datetime.fromisoformat(row[11]) if row[11] else None,
                    notes=row[12] if len(row) > 12 else None
                )
                db.session.add(shift)
                added_shift_records += 1

            elif mode == "coverage":
                coverage = CoverageShift(
                    date=datetime.fromisoformat(row[1]).date(),
                    shift=row[2],
                    start=row[3],
                    end=row[4],
                    hours=float(row[5]),
                    org_name=row[6],
                    cov_name=row[7],
                    reason=row[8],
                    shift_type=row[9],
                    source_pdf=row[10],
                    created_at=datetime.fromisoformat(row[11]) if row[11] else None,
                    modified_at=datetime.fromisoformat(row[12]) if row[12] else None,
                    notes=row[13] if len(row) > 13 else None
                )
                db.session.add(coverage)
                added_coverage_shifts += 1

        db.session.commit()

        print(f"[CSV Import] Imported {added_shift_records} ShiftRecord(s) and {added_coverage_shifts} CoverageShift(s).")
        
        return jsonify({
            "message": "CSV import successful",
            "shift_records_added": added_shift_records,
            "coverage_shifts_added": added_coverage_shifts
        })

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


# //// Export JSON //// #
def export_shifts_json():
    shift_records = [
        {
            "id": r.id,
            "name": r.name,
            "date": r.date.isoformat(),
            "shift": r.shift,
            "start": r.start,
            "end": r.end,
            "type": r.type,
            "hours": r.hours,
            "is_coverage": r.is_coverage,
            "source_pdf": r.source_pdf,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "modified_at": r.modified_at.isoformat() if r.modified_at else None,
            "notes": r.notes
        }
        for r in ShiftRecord.query.all()
    ]

    coverage_shifts = [
        {
            "id": c.id,
            "date": c.date.isoformat(),
            "shift": c.shift,
            "start": c.start,
            "end": c.end,
            "hours": c.hours,
            "org_name": c.org_name,
            "cov_name": c.cov_name,
            "reason": c.reason,
            "shift_type": c.shift_type,
            "source_pdf": c.source_pdf,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "modified_at": c.modified_at.isoformat() if c.modified_at else None,
            "notes": c.notes,
            "shift_record_id": c.shift_record_id
        }
        for c in CoverageShift.query.all()
    ]

    # Log export
    print(f"[JSON Export] Exported {len(shift_records)} ShiftRecord(s) and {len(coverage_shifts)} CoverageShift(s).")
    
    # Convert the data to JSON and return it as a downloadable file
    data = {
        "shift_records": shift_records,
        "coverage_shifts": coverage_shifts
    }
    
    # Force download of the JSON file
    response = Response(
        json.dumps(data, indent=2),  # JSON formatted with indentation
        mimetype="application/json",
        headers={
            "Content-Disposition": "attachment; filename=argx_export.json"  # Forces download
        }
    )
    return response

# //// Export CSV //// #
def export_shifts_csv():
    output = StringIO()
    writer = csv.writer(output)

    writer.writerow(["ShiftRecord Table"])
    writer.writerow(["ID", "Name", "Date", "Shift", "Start", "End", "Type", "Hours", "IsCoverage", "SourcePDF", "Created", "Modified", "Notes"])
    for r in ShiftRecord.query.all():
        writer.writerow([
            r.id, r.name, r.date, r.shift, r.start, r.end, r.type,
            r.hours, r.is_coverage, r.source_pdf, r.created_at, r.modified_at, r.notes
        ])

    writer.writerow([])
    writer.writerow(["CoverageShift Table"])
    writer.writerow(["ID", "Date", "Shift", "Start", "End", "Hours", "OrgName", "CovName", "Reason", "ShiftType", "SourcePDF", "Created", "Modified", "Notes"])
    for c in CoverageShift.query.all():
        writer.writerow([
            c.id, c.date, c.shift, c.start, c.end, c.hours, c.org_name, c.cov_name,
            c.reason, c.shift_type, c.source_pdf, c.created_at, c.modified_at, c.notes
        ])

    output.seek(0)

    print(f"[CSV Export] Exported {ShiftRecord.query.count()} ShiftRecord(s) and {CoverageShift.query.count()} CoverageShift(s).")
    
    return Response(output, mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=argx_export.csv"})

