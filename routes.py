# ==============================
# ROUTES.PY — ARGX MAIN ROUTE HANDLER
# ==============================
# This module defines all Flask routes for:
# - Index rendering
# - File uploads (PDF and XLSX)
# - Data exports and imports
# - Shift lookup API endpoints
# ==============================

import os
import re
from flask import (
    request,
    render_template,
    jsonify,
    send_file,
)
from dataman import (
    export_shifts_csv,
    export_shifts_json,
    import_shifts_from_json,
    import_shifts_from_csv,
)
from config import INVENTORY_DF
from report import get_working_on_date, process_report
from models import ShiftRecord, CoverageShift
from seniority import load_seniority_file
from inventory import load_inventory_data, get_inventory_usls, search_inventory
from datetime import datetime
from handlers.index_handler import process_index_upload

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# Register all application routes
# ==============================
def register_routes(app):

    @app.template_filter("reorder_name")
    def reorder_name(value):
        parts = value.split(", ")
        return f"{parts[1]} {parts[0]}" if len(parts) == 2 else value

    # ==============================
    # INVENTORY API
    # ==============================
    @app.route("/inventory-usls")
    def inventory_usls():
        result = get_inventory_usls(INVENTORY_DF)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)

    @app.route("/inventory-search")
    def inventory_search():
        term = request.args.get("term", "")
        usl = request.args.get("usl", "Any")
        sort = request.args.get("sort", "QTY")
        direction = request.args.get("dir", "desc")
        results = search_inventory(INVENTORY_DF, term, usl, sort, direction)
        return jsonify(results)


    # ==============================
    # GET/POST INDEX FILE HANDLING
    # ==============================
    @app.route("/", methods=["GET"])
    def index():
        return render_template("index.html")
    
    @app.route("/", methods=["POST"])
    def post_index():
        return process_index_upload()


    # ==============================
    # Export Routes
    # ==============================
    @app.route("/export/shifts.csv")
    def handle_export_csv():
        return export_shifts_csv()

    @app.route("/export/shifts.json")
    def handle_export_json():
        return export_shifts_json()

    @app.route("/import/shifts", methods=["POST"])
    def handle_import_json():
        return import_shifts_from_json()

    @app.route("/import/shifts.csv", methods=["POST"])
    def handle_import_csv():
        return import_shifts_from_csv()

    # ==============================
    # Working Date API
    # ==============================
    @app.route("/api/working_on_date")
    def working_on_date():
        date_str = request.args.get("date")
        if not date_str:
            return jsonify({"error": "Missing date parameter"}), 400

        pdf_paths = [
            os.path.join(UPLOAD_FOLDER, f)
            for f in os.listdir(UPLOAD_FOLDER)
            if f.endswith(".pdf")
        ]
        stop_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        _, _, df = process_report(pdf_paths, return_df=True, stop_on_date=stop_date)
        result = get_working_on_date(df, date_str)
        return jsonify(result)

    # ==============================
    # Download Route
    # ==============================
    @app.route("/download/<filename>")
    def download(filename):
        file_path = os.path.join("/tmp", filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return "File not found", 404

    # ==============================
    # Panel Routes
    # ==============================
    @app.route("/1902")
    def panel():
        return render_template("panel.html")

    @app.route("/61617")
    def inventory():
        return render_template("inventory.html", table=[])

    # ==============================
    # DB Check
    # ==============================
    @app.route("/dbcheck")
    def dbcheck():
        try:
            shift_count = ShiftRecord.query.count()
            coverage_count = CoverageShift.query.count()
            return {
                "ShiftRecords": shift_count,
                "CoverageShifts": coverage_count
            }
        except Exception as e:
            return {"error": str(e)}
