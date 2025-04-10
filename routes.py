
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

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
MAX_PDFS = 30

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def register_routes(app):

    @app.template_filter("reorder_name")
    def reorder_name(value):
        parts = value.split(", ")
        return f"{parts[1]} {parts[0]}" if len(parts) == 2 else value

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

    @app.route("/", methods=["POST"])
    def process_index():
        def format_pdf_display_name(filename):
            match = re.search(r'(\d{4}-\d{2}-\d{2})', filename)
            date_str = match.group(1) if match else "Unknown"
            return f"ARG_{date_str}.pdf", filename

        uploaded_files = request.files.getlist("pdfs")
        existing_files = request.form.getlist("existing_pdfs")

        all_files = []

        for file in uploaded_files:
            if file.filename.endswith(".pdf"):
                display_name, _ = format_pdf_display_name(file.filename)
                save_path = os.path.join(UPLOAD_FOLDER, display_name)
                if not os.path.exists(save_path):
                    file.save(save_path)
                all_files.append(save_path)

        existing_paths = [
            os.path.join(UPLOAD_FOLDER, f)
            for f in existing_files
            if f.endswith(".pdf") and os.path.exists(os.path.join(UPLOAD_FOLDER, f))
        ]

        all_files.extend(existing_paths)

        if not all_files:
            return render_template("index.html", error="No valid PDFs selected or uploaded.")

        output_files, stats = process_report(all_files)
        if output_files:
            filenames = [os.path.basename(path) for path in output_files]
            return render_template("result.html", outputs=filenames, stats=stats)
        else:
            return render_template("index.html", error="Something went wrong generating the report.")

    @app.route("/export/shifts.csv")
    def handle_export_csv():
        return export_shifts_csv()

    @app.route("/export/shifts.json")
    def handle_export_json():
        return export_shifts_json()

    @app.route("/import/shifts", methods=["POST"])
    def handle_import_json():
        print("[INFO] /import/shifts called")
        return import_shifts_from_json()

    @app.route("/import/shifts.csv", methods=["POST"])
    def handle_import_csv():
        print("[INFO] /import/shifts.csv called")
        return import_shifts_from_csv()

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
        _, _, df = process_report(pdf_paths, return_df=True)
        result = get_working_on_date(df, date_str)
        return jsonify(result)

    @app.route("/download/<filename>")
    def download(filename):
        file_path = os.path.join("/tmp", filename)
        if os.path.exists(file_path):
            return send_file(file_path, as_attachment=True)
        else:
            return "File not found", 404

    @app.route("/1902")
    def panel():
        return render_template("panel.html")

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
