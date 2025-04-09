from flask import Flask, request, render_template, send_file, jsonify
import os
import uuid
import re
from report import process_report, get_working_on_date
from flask_sqlalchemy import SQLAlchemy
from models import db

app = Flask(__name__)

# Use DATABASE_URL if present (e.g. on Render), else fallback to local sqlite
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

#UPLOAD_FOLDER = "/tmp/uploads"
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
MAX_PDFS = 30

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.template_filter("reorder_name")
def reorder_name(value):
    parts = value.split(", ")
    return f"{parts[1]} {parts[0]}" if len(parts) == 2 else value


@app.route("/api/working_on_date")
def working_on_date():
    date_str = request.args.get("date")
    if not date_str:
        return jsonify({"error": "Missing date parameter"}), 400

    # Load your PDF files here — adjust this to where your PDFs live
    pdf_folder = "uploads"  # or whatever folder your app uses
    pdf_paths = [os.path.join(pdf_folder, f) for f in os.listdir(pdf_folder) if f.endswith(".pdf")]

    _, _, df = process_report(pdf_paths, return_df=True)

    result = get_working_on_date(df, date_str)
    return jsonify(result)


@app.route("/", methods=["GET", "POST"])
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

    if request.method == "POST":
        uploaded_files = request.files.getlist("pdfs")
        existing_files = request.form.getlist("existing_pdfs")

        print("DEBUG existing_files:", existing_files)

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

        print("DEBUG resolved paths:", existing_paths)

        all_files.extend(existing_paths)

        print("DEBUG all_files before call:", all_files)

        if not all_files:
            return render_template("index.html", error="No valid PDFs selected or uploaded.", recent_pdfs=recent_pdfs)

        output_files, stats = process_report(all_files)

        if output_files:
            filenames = [os.path.basename(path) for path in output_files]
            return render_template("result.html", outputs=filenames, stats=stats)
        else:
            return render_template("index.html", error="Something went wrong generating the report.", recent_pdfs=recent_pdfs)

    return render_template("index.html", recent_pdfs=recent_pdfs)

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
    from models import ShiftRecord, CoverageShift
    try:
        shift_count = ShiftRecord.query.count()
        coverage_count = CoverageShift.query.count()
        return {
            "ShiftRecords": shift_count,
            "CoverageShifts": coverage_count
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    app.run(debug=True)
