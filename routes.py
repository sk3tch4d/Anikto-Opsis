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
from report import process_report, get_working_on_date
from models import ShiftRecord, CoverageShift
from seniority import load_seniority_file
from inventory import load_inventory_data, get_inventory_usls, search_inventory
from datetime import datetime

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
MAX_PDFS = 30
INVENTORY_DF = None

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
        global INVENTORY_DF
        result = get_inventory_usls(INVENTORY_DF)
        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result)

    @app.route("/inventory-search")
    def inventory_search():
        global INVENTORY_DF
        term = request.args.get("term", "")
        usl = request.args.get("usl", "Any")
        sort = request.args.get("sort", "QTY")
        direction = request.args.get("dir", "desc")
        results = search_inventory(INVENTORY_DF, term, usl, sort, direction)
        return jsonify(results)


    # ==============================
    # GET: Render index upload page
    # ==============================
    @app.route("/")
    def index():
        def format_pdf_display_name(filename):
            match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
            date_str = match.group(1) if match else "Unknown"
            return f"ARG_{date_str}.pdf", filename

        recent_pdfs_raw = sorted(
            [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".pdf")],
            key=lambda f: os.path.getmtime(os.path.join(UPLOAD_FOLDER, f)),
            reverse=True
        )[:MAX_PDFS]

        recent_pdfs = [format_pdf_display_name(f) for f in recent_pdfs_raw]
        return render_template("index.html", recent_pdfs=recent_pdfs)

    # ==============================
    # POST: Handle file uploads
    # ==============================
    @app.route("/", methods=["POST"])
    def process_index():
        uploaded_files = request.files.getlist("uploads")
        existing_files = request.form.getlist("existing_pdfs")

        pdf_files = []
        seniority_df = None
        seniority_filename = None

        for file in uploaded_files:
            ext = os.path.splitext(file.filename)[1].lower()
            fname_lower = file.filename.lower()

            if ext == ".pdf":
                filename = file.filename
                save_path = os.path.join(UPLOAD_FOLDER, filename)
                if not os.path.exists(save_path):
                    file.save(save_path)
                pdf_files.append(save_path)

            elif ext == ".xlsx":
                if all(keyword in fname_lower for keyword in ["cupe", "seniority", "list"]):
                    match = re.search(r"(\d{4}-\d{2}-\d{2})", file.filename)
                    date_str = match.group(1) if match else datetime.now().strftime("%Y-%m-%d")
                    new_filename = f"CUPE-SL-{date_str}.xlsx"

                    save_path = os.path.join("/tmp", new_filename)
                    file.save(save_path)
                    seniority_df = load_seniority_file(save_path)
                    seniority_filename = new_filename
                    app.logger.info(f"[SENIORITY] Loaded: {save_path}")

                elif "inventory" in fname_lower:
                    save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
                    file.save(save_path)
                    global INVENTORY_DF
                    INVENTORY_DF = load_inventory_data(path=save_path)
                    app.logger.info(f"[INVENTORY] Reloaded from: {save_path}")

                else:
                    app.logger.warning(f"[SKIPPED] Invalid Excel file: {file.filename}")

        for fname in existing_files:
            if fname.endswith(".pdf"):
                existing_path = os.path.join(UPLOAD_FOLDER, fname)
                if os.path.exists(existing_path):
                    pdf_files.append(existing_path)

        if not pdf_files and seniority_df is None:
            if INVENTORY_DF is not None:
                return render_template("inventory.html", table=[])
            return render_template("index.html", error="No valid files selected or uploaded.")

        if seniority_df is not None and not pdf_files:
            return render_template("seniority.html", table=seniority_df.to_dict(orient="records"), filename=seniority_filename)

        output_files, stats = process_report(pdf_files)
        return render_template("arg.html", outputs=[os.path.basename(f) for f in output_files], stats=stats)

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
