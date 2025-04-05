import os
from flask import Flask, render_template, request, send_file, redirect, url_for, flash
from werkzeug.utils import secure_filename
import uuid
import subprocess

app = Flask(__name__)
app.secret_key = "argx_secret"
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "output"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        files = request.files.getlist("pdfs")
        generate_argx = request.form.get("generate_argx") == "on"
        generate_argm = request.form.get("generate_argm") == "on"

        if not (generate_argx or generate_argm):
            flash("Please select at least one output format.")
            return redirect(request.url)

        for f in files:
            filename = secure_filename(f.filename)
            f.save(os.path.join(UPLOAD_FOLDER, filename))

        job_id = uuid.uuid4().hex
        subprocess.run([
            "python3", "ARGX_Generator.py",
            "--input_folder", UPLOAD_FOLDER,
            "--output_folder", OUTPUT_FOLDER,
            "--job_id", job_id,
            "--argx" if generate_argx else "",
            "--argm" if generate_argm else ""
        ], check=True)

        return redirect(url_for("results", job_id=job_id))
    return render_template("index.html")

@app.route("/results/<job_id>")
def results(job_id):
    files = []
    for f in os.listdir(OUTPUT_FOLDER):
        if f.startswith(job_id):
            files.append(f)
    return render_template("results.html", files=files, job_id=job_id)

@app.route("/download/<job_id>/<filename>")
def download(job_id, filename):
    path = os.path.join(OUTPUT_FOLDER, filename)
    return send_file(path, as_attachment=True)
