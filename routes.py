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
    Flask,
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
from inventory import load_inventory_data
from datetime import datetime

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
MAX_PDFS = 30

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# Register all application routes
# ==============================
def register_routes(app):

    # Reformat name from "Last, First" to "First Last"
    @app.template_filter("reorder_name")
    def reorder_name(value):
        parts = value.split(", ")
        return f"{parts[1]} {parts[0]}" if len(parts) == 2 else value

    # ==============================
    # INVENTORY API
    # ==============================
    if INVENTORY_DF is None:
        return jsonify({"error": "Inventory data not loaded."}), 400

    @app.route("/inventory-usls")
    def inventory_usls():
        usls = sorted(INVENTORY_DF["USL"].dropna().unique().tolist())
        return jsonify(usls)

    @app.route("/inventory-search")
    def inventory_search():
        global INVENTORY_DF
        if "INVENTORY_DF" not in globals():
            return jsonify({"error": "No inventory loaded yet."}), 400

        term = request.args.get("term", "").strip().lower()
        usl = request.args.get("usl", "Any")

        df = INVENTORY_DF
        if usl != "Any":
            df = df[df["USL"].str.lower() == usl.lower()]

        if term:
            df = df[df.apply(lambda row: row.astype(str).str.lower().str.contains(term).any(), axis=1)]

        df = df.sort_values(by="QTY", ascending=False).head(100)

        return jsonify(df[["Num", "Old", "Description", "USL", "QTY", "UOM"]].to_dict(orient="records"))

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
    # POST: HANDLE FILE UPLOADS
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

            if ext == ".pdf":
                filename = file.filename
                save_path = os.path.join(UPLOAD_FOLDER, filename)
                if not os.path.exists(save_path):
                    file.save(save_path)
                pdf_files.append(save_path)
            
            elif ext == ".xlsx":
                fname_lower = file.filename.lower()
            
                if all(keyword in fname_lower for keyword in ["cupe", "seniority", "list"]):
                    # CUPE Seniority logic (already in your file)
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
                    from inventory import load_inventory_data
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
            if 'INVENTORY_DF' in globals():
                return render_template("inventory.html", table=[])
            return render_template("index.html", error="No valid files selected or uploaded.")
        
        if seniority_df is not None and not pdf_files:
            return render_template("seniority.html", table=seniority_df.to_dict(orient="records"), filename=seniority_filename)
        
        output_files, stats = process_report(pdf_files)
        return render_template("arg.html", outputs=[os.path.basename(f) for f in output_files], stats=stats)


    # ==============================
    # GET: Export shift records as CSV
    # ==============================
    @app.route("/export/shifts.csv")
    def handle_export_csv():
        return export_shifts_csv()

    # ==============================
    # GET: Export shift records as JSON
    # ==============================
    @app.route("/export/shifts.json")
    def handle_export_json():
        return export_shifts_json()

    # ==============================
    # POST: Import shift records from JSON
    # ==============================
    @app.route("/import/shifts", methods=["POST"])
    def handle_import_json():
        print("[INFO] /import/shifts called")
        return import_shifts_from_json()

    # ==============================
    # POST: Import shift records from CSV
    # ==============================
    @app.route("/import/shifts.csv", methods=["POST"])
    def handle_import_csv():
        print("[INFO] /import/shifts.csv called")
        return import_shifts_from_csv()

    # ==============================
    # GET: Working employees on specific date
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
    # GET: Download processed file
    # ==============================
    @app.route("/download/<filename>")
    def download(filename):
        file_path = os.path.join("/tmp", filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return "File not found", 404

    # ==============================
    # GET: Panel placeholder endpoint
    # ==============================
    @app.route("/1902")
    def panel():
        return render_template("panel.html")

    # ==============================
    # GET: Panel placeholder endpoint
    # ==============================
    @app.route("/61617")
    def inventory():
        #return render_template("inventory.html")
        table = get_table_data_or_none()  # hypothetical function
        return render_template("inventory.html", table=table or [])

    # ==============================
    # GET: Quick database count check
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
