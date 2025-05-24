# ==============================
# ROUTES.PY — MAIN ROUTE HANDLER
# ==============================

import os
import re
import config
import numpy as np
from datetime import datetime
from flask import (
    request,
    render_template,
    jsonify,
    send_file,
    redirect, 
    session, 
    url_for,
)
from config import UPLOAD_FOLDER
from config import DEV_MODE
from dataman import (
    export_shifts_csv,
    export_shifts_json,
    import_shifts_from_json,
    import_shifts_from_csv,
)
from inv_cleaner import clean_xlsx_and_save
from report import get_working_on_date, get_shifts_for_date, process_report
from models import ShiftRecord, CoverageShift
from seniority import load_seniority_file
from inventory import load_inventory_data, get_inventory_usls, search_inventory
from zwdiseg import load_zwdiseg_data, get_zwdiseg_usls, search_zwdiseg
from optimization import search_optimization
from handlers.index_handler import process_index_upload

# ==============================
# ENSURE UPLOAD FOLDER EXISTS
# ==============================
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# REGISTER APPLICATION ROUTES
# ==============================
def register_routes(app):

    # ==============================
    # INDEX HANDLING: POST & GET
    # ==============================
    @app.route("/", methods=["GET"])
    def index():
        return render_template("index.html")
    # ==============================
    @app.route("/", methods=["POST"])
    def post_index():
        return process_index_upload()

    # ==============================
    # INVENTORY API ROUTES
    # ==============================
    @app.route("/inventory-usls")
    def inventory_usls():
        result = get_inventory_usls(config.INVENTORY_DF)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    # ==============================
    @app.route("/inventory-search")
    def inventory_search():
        term = request.args.get("term", "")
        usl = request.args.get("usl", "Any")
        sort = request.args.get("sort", "QTY")
        direction = request.args.get("dir", "desc")
        results = search_inventory(config.INVENTORY_DF, term, usl, sort, direction)
        for r in results:
            for k, v in r.items():
                if isinstance(v, float) and np.isnan(v):
                    r[k] = None
        return jsonify(results)

    # ==============================
    # ZWDISEG API ROUTES
    # ==============================
    @app.route("/zwdiseg-usls")
    def zwdiseg_usls():
        result = get_zwdiseg_usls(config.ZWDISEG_DF)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)
    # ==============================
    @app.route("/zwdiseg-search")
    def zwdiseg_search():
        term = request.args.get("term", "")
        usl = request.args.get("usl", "Any")
        sort = request.args.get("sort", "QTY")
        direction = request.args.get("dir", "desc")
        results = search_zwdiseg(config.ZWDISEG_DF, term, usl, sort, direction)
        for r in results:
            for k, v in r.items():
                if isinstance(v, float) and np.isnan(v):
                    r[k] = None
        return jsonify(results)

    # ==============================
    # OPTIMIZATION API ROUTES
    # ==============================
    @app.route("/download/optimized")
    def download_optimized():
        path = config.OPTIMIZATION_PATH
        if path and os.path.exists(path):
            return send_file(path, as_attachment=True, download_name=os.path.basename(path))
        return "Optimized file not available.", 404
    # ==============================
    @app.route("/optimization-search")
    def optimization_search():
        term = request.args.get("term", "")
        cart = request.args.get("cart", "All")
        sort = request.args.get("sort", "site_suggested_rop")
        direction = request.args.get("dir", "desc")
        results = search_optimization(config.OPTIMIZATION_DF, term, cart, sort, direction)
        for r in results:
            for k, v in r.items():
                if isinstance(v, float) and np.isnan(v):
                    r[k] = None
        return jsonify(results)

    # ==============================
    # CLEAN INVENTORY
    # ==============================
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

    # ==============================
    # ARG SCHEDULE API ROUTES
    # ==============================
    @app.route("/api/working_on_date")
    def working_on_date():
        date_str = request.args.get("date")
        if not date_str:
            return jsonify({"error": "Missing date parameter"}), 400

        result, status = get_shifts_for_date(date_str)
        return jsonify(result), status
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
    # ==============================
    @app.template_filter("reorder_name")
    def reorder_name(value):
        parts = value.split(", ")
        return f"{parts[1]} {parts[0]}" if len(parts) == 2 else value
    # ==============================
    @app.route("/export/shifts.csv")
    def handle_export_csv():
        return export_shifts_csv()
    # ==============================
    @app.route("/export/shifts.json")
    def handle_export_json():
        return export_shifts_json()
    # ==============================
    @app.route("/import/shifts", methods=["POST"])
    def handle_import_json():
        return import_shifts_from_json()
    # ==============================
    @app.route("/import/shifts.csv", methods=["POST"])
    def handle_import_csv():
        return import_shifts_from_csv()

    # ==============================
    # REDIRECT ROUTES
    # ==============================
    @app.route("/1902")
    def panel():
        return render_template("panel.html")
    # ==============================
    @app.route("/61617")
    def inventory():
        return render_template("inventory.html", table=[])
    # ==============================
    @app.route("/test")
    def testing():
        return render_template("testing.html", table=[])

    # ==============================
    # DEV MODE SESSION / CHECK
    # ==============================
    @app.route("/check-dev")
    def check_dev():
        return jsonify({"dev": session.get("dev", False)})
    # ==============================
    @app.route("/dev-mode", methods=["POST"])
    def dev_mode():
        # Handle both JSON and form
        if request.is_json:
            data = request.get_json()
            token = data.get("token", "").strip().lower()
        else:
            token = request.form.get("token", "").strip().lower()
    
        print("Access Token:", repr(token))
        
        if token in DEV_MODE:
            session["dev"] = True
            print("Valid Access Token!")
            if request.is_json:
                return jsonify(success=True)
            return redirect(url_for("index"))
    
        print("Invalid Access Token!")
        if request.is_json:
            return jsonify(success=False), 401
        return redirect(url_for("index"))
    # ==============================
    @app.route("/logout-dev")
    def logout_dev():
        session.pop("dev", None)
        return jsonify(success=True)
    
    # ==============================
    # HANDLE DOWNLOADS
    # ==============================
    @app.route("/download/<filename>")
    def download(filename):
        file_path = os.path.join("/tmp", filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return "File not found", 404
