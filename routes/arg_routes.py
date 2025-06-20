# ==============================
# ARG_ROUTES.PY
# ==============================

import os
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime
from models import ShiftRecord, CoverageShift
from dataman import (
    export_shifts_csv,
    export_shifts_json,
    import_shifts_from_json,
    import_shifts_from_csv,
)
from report import get_shifts_for_date, process_report
from config import UPLOAD_FOLDER

# ==============================
# SETUP ARG BP
# ==============================
arg_bp = Blueprint("arg", __name__)

# ==============================
# WORKING ON DATE ROUTE
# ==============================
@arg_bp.route("/api/working_on_date")
def api_working_on_date():
    date_str = request.args.get("date")
    filter_type = request.args.get("filter", "all").lower()
    
    pdf_paths = [
        os.path.join(UPLOAD_FOLDER, f)
        for f in os.listdir(UPLOAD_FOLDER)
        if f.endswith(".pdf")
    ]
    if not pdf_paths:
        return jsonify({"error": "No PDF data available"}), 404

    outputs, stats, df, raw_codes = process_report(
        pdf_paths, return_df=True
    )

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    return jsonify(group_by_shift(df, target_date, raw_codes, filter_type))


# ==============================
# DB CHECK ROUTE
# ==============================
@arg_bp.route("/dbcheck")
def dbcheck():
    current_app.logger.debug("🩺 /dbcheck route hit")
    try:
        shift_count = ShiftRecord.query.count()
        coverage_count = CoverageShift.query.count()
        current_app.logger.debug(f"📊 ShiftRecords: {shift_count}, CoverageShifts: {coverage_count}")
        return {
            "ShiftRecords": shift_count,
            "CoverageShifts": coverage_count
        }
    except Exception as e:
        current_app.logger.exception("❌ DB check failed")
        return {"error": str(e)}

# ==============================
# EXPORT SHIFTS ROUTE — CSV
# ==============================
@arg_bp.route("/export/shifts.csv")
def handle_export_csv():
    current_app.logger.debug("📤 Exporting shifts (CSV)")
    return export_shifts_csv()

# ==============================
# EXPORT SHIFTS ROUTE — JSON
# ==============================
@arg_bp.route("/export/shifts.json")
def handle_export_json():
    current_app.logger.debug("📤 Exporting shifts (JSON)")
    return export_shifts_json()

# ==============================
# IMPORT SHIFTS ROUTE — JSON
# ==============================
@arg_bp.route("/import/shifts", methods=["POST"])
def handle_import_json():
    current_app.logger.debug("📥 Importing shifts (JSON)")
    return import_shifts_from_json()

# ==============================
# IMPORT SHIFTS ROUTE — CSV
# ==============================
@arg_bp.route("/import/shifts.csv", methods=["POST"])
def handle_import_csv():
    current_app.logger.debug("📥 Importing shifts (CSV)")
    return import_shifts_from_csv()
