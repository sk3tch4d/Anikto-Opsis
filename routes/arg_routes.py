# ==============================
# ARG_ROUTES.PY
# ==============================

from flask import Blueprint, request, jsonify, current_app
from models import ShiftRecord, CoverageShift
from dataman import (
    export_shifts_csv,
    export_shifts_json,
    import_shifts_from_json,
    import_shifts_from_csv,
)
from report import get_shifts_for_date

# ==============================
# SETUP ARG BP
# ==============================
arg_bp = Blueprint("arg", __name__)

# ==============================
# WORKING ON DATE ROUTE
# ==============================
@arg_bp.route("/api/working_on_date")
def working_on_date():
    current_app.logger.debug("📅 /api/working_on_date route hit")

    date_str = request.args.get("date")
    if not date_str:
        current_app.logger.warning("⚠️ Missing 'date' parameter in request")
        return jsonify({"error": "Missing date parameter"}), 400

    current_app.logger.debug(f"📆 Fetching shifts for date: {date_str}")
    result, status = get_shifts_for_date(date_str)
    return jsonify(result), status

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
