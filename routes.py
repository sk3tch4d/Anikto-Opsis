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
import config
import tempfile
from config import UPLOAD_FOLDER
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
from inv_cleaner import clean_xlsx, clean_xlsx_and_save, clean_multiple_and_merge
from report import get_working_on_date, get_shifts_for_date, process_report
from models import ShiftRecord, CoverageShift
from seniority import load_seniority_file
from inventory import load_inventory_data, get_inventory_usls, search_inventory
from datetime import datetime
from handlers.index_handler import process_index_upload

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
        result = get_inventory_usls(config.INVENTORY_DF)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)

    # ==============================
    # XLSX CLEANING API
    # ==============================
    @app.route("/inventory-search")
    def inventory_search():
        term = request.args.get("term", "")
        usl = request.args.get("usl", "Any")
        sort = request.args.get("sort", "QTY")
        direction = request.args.get("dir", "desc")
        results = search_inventory(config.INVENTORY_DF, term, usl, sort, direction)
        return jsonify(results)

    @app.route("/clean-inventory-xlsx", methods=["POST"])
    def clean_inventory_xlsx():
        file = request.files.get('file')
        if not file:
            return jsonify({"error": "No file uploaded"}), 400

        try:
            tmp_path = clean_xlsx_and_save(file)
            response = send_file(tmp_path, as_attachment=True, download_name='cleaned_inventory.xlsx')

            @response.call_on_close
            def cleanup():
                try:
                    os.unlink(tmp_path)
                except Exception as e:
                    app.logger.error(f"Error deleting temp file: {e}")

            return response

        except ValueError as ve:
            return jsonify({"error": str(ve)}), 400
        except Exception as e:
            return jsonify({"error": str(e)}), 500


    @app.route("/clean-merge-xlsx", methods=["POST"])
    def clean_and_merge_inventory():
        uploaded_files = request.files.getlist("uploads")
        if not uploaded_files:
            return jsonify({"error": "No files uploaded."}), 400
    
        try:
            merged_path, merged_filename = clean_multiple_and_merge(uploaded_files)
            response = send_file(merged_path, as_attachment=True, download_name=merged_filename)
    
            @response.call_on_close
            def cleanup():
                try:
                    os.unlink(merged_path)
                except Exception as e:
                    app.logger.error(f"Error deleting temp file: {e}")
    
            return response
    
        except Exception as e:
            return jsonify({"error": str(e)}), 500



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
    
        result, status = get_shifts_for_date(date_str)
        return jsonify(result), status

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

    @app.route("/test")
    def testing():
        return render_template("testing.html", table=[])

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
