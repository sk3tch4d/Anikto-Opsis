# ==============================
# ARG_ROUTES.PY
# ==============================

import os
from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
from models import ShiftRecord, CoverageShift
from dataman import (
    export_shifts_csv,
    export_shifts_json,
    import_shifts_from_json,
    import_shifts_from_csv,
)
from report import get_shifts_for_date, process_report, group_by_shift, normalize_name, get_pay_period
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
        pdf_paths,
        return_df=True,
        steps=set(),  # ⬅️ Skip heavy processing
        filter_type=filter_type
    )

    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"error": "Invalid date format. Use YYYY-MM-DD"}), 400

    return jsonify(group_by_shift(df, target_date, raw_codes, filter_type))

# ==============================
# API ARG NAME LOOKUP
# ==============================
@arg_bp.route("/api/lookup_names")
def api_lookup_names():
    try:
        from report import get_name_filter, normalize_name

        ft_names = get_name_filter("ft")
        pt_names = get_name_filter("pt")
        all_names = sorted(ft_names | pt_names)

        return jsonify({"names": list(all_names)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==============================
# API SCHEDULE BY NAME / FILTER
# ==============================
@arg_bp.route("/api/lookup_schedule")
def api_lookup_schedule():
    name = request.args.get("name", "").strip()
    filter_type = request.args.get("filter", "all").lower()
    if not name:
        return jsonify({"error": "Name parameter is required"}), 400

    # Find PDF report files
    pdf_paths = [
        os.path.join(UPLOAD_FOLDER, f)
        for f in os.listdir(UPLOAD_FOLDER)
        if f.lower().endswith(".pdf")
    ]
    if not pdf_paths:
        return jsonify({"error": "No PDF data available"}), 404

    # Parse reports (fast flags)
    _, _, df, raw_codes = process_report(
        pdf_paths,
        return_df=True,
        steps=set(),  # skip heavy processing
        filter_type="all"
    )

    if df.empty:
        return jsonify({"error": "No schedule data parsed"}), 404

    from report import normalize_name, get_pay_period

    # Normalize and filter for this employee
    target_norm = normalize_name(name)
    person_df = df[df["Name"].apply(lambda n: normalize_name(n) == target_norm)]

    if person_df.empty:
        return jsonify({"shifts": []})

    # Apply date range filter if needed
    today = datetime.now().date()

    if filter_type == "week":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
        person_df = person_df[person_df["DateObj"].between(start, end)]

    elif filter_type == "period":
        # Use pay period based on your get_pay_period logic
        pp = get_pay_period(today)
        person_df = person_df[person_df["DateObj"].apply(lambda d: get_pay_period(d) == pp)]

    # Prepare output
    shifts = (
        person_df[["DateObj", "Shift", "ShiftType"]]
        .drop_duplicates()
        .sort_values(by="DateObj")
        .apply(lambda r: {
            "date": r["DateObj"].strftime("%Y-%m-%d"),
            "shift": r["Shift"],
            "type": r["ShiftType"]
        }, axis=1)
        .tolist()
    )

    return jsonify({"shifts": shifts})

# ==============================
# API ARG STATS ROUTE
# ==============================
@arg_bp.route("/api/arg_stats")
def api_arg_stats():
    filter_type = request.args.get("filter", "all").lower()

    pdf_paths = [
        os.path.join(UPLOAD_FOLDER, f)
        for f in os.listdir(UPLOAD_FOLDER)
        if f.endswith(".pdf")
    ]

    if not pdf_paths:
        return jsonify({"error": "No PDF data available"}), 404

    # Pass the filter into process_report
    _, stats, _, _ = process_report(
        pdf_paths, return_df=True, steps={"stats"}, stop_on_date=None, filter_type=filter_type
    )

    return jsonify({"stats": stats})

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
