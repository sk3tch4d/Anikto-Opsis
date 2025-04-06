from flask import Flask, request, render_template, send_file
import os
import uuid
import re
from ARGX_Generator import generate_argx_and_heatmap

UPLOAD_FOLDER = "/tmp/uploads"
MAX_PDFS = 30

os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)

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
        print("DEBUG resolved paths:", existing_paths)

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

        print("DEBUG all_files before call:", all_files)

        if not all_files:
            return render_template("index.html", error="No valid PDFs selected or uploaded.", recent_pdfs=recent_pdfs)

        output_files, stats = generate_argx_and_heatmap(all_files)

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

if __name__ == "__main__":
    app.run(debug=True)
