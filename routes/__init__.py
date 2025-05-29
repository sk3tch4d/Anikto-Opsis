# ==============================
# __INIT__.PY MAIN ROUTE HANDLER
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
from utils.data_search import handle_search_request
from report import get_working_on_date, get_shifts_for_date, process_report
from models import ShiftRecord, CoverageShift
from seniority import load_seniority_file
from zwdiseg import load_zwdiseg_data, get_zwdiseg_usls, search_zwdiseg
from optimization import search_optimization
from handlers.index_handler import process_index_upload

from .file_routes import file_bp
from .inventory_routes import inventory_bp
from .zwdiseg_routes import zwdiseg_bp

# ==============================
# ENSURE UPLOAD FOLDER EXISTS
# ==============================
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# REGISTER APPLICATION ROUTES
# ==============================
def register_routes(app):

    # ==============================
    # REGISTER BLUEPRINTS
    # ==============================
    app.register_blueprint(inventory_bp)
    app.register_blueprint(zwdiseg_bp)
    
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
        return handle_search_request(config.OPTIMIZATION_DF, search_optimization, default_sort="site_suggested_rop")

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
    
        print("🔑 Access Token:", repr(token))
        
        if token in DEV_MODE:
            session["dev"] = True
            print("🔓 Valid Access Token!")
            if request.is_json:
                return jsonify(success=True)
            return redirect(url_for("index"))
    
        print("🔒 Invalid Access Token!")
        if request.is_json:
            return jsonify(success=False), 401
        return redirect(url_for("index"))
    # ==============================
    @app.route("/logout-dev")
    def logout_dev():
        session.pop("dev", None)
        return jsonify(success=True)
    
