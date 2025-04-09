# ######## DB_MAN ########
from models import ShiftRecord, CoverageShift
import csv
from io import StringIO
from flask import Response, jsonify

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
    return Response(output, mimetype="text/csv", headers={"Content-Disposition": "attachment; filename=argx_export.csv"})


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

    return jsonify({
        "shift_records": shift_records,
        "coverage_shifts": coverage_shifts
    })
