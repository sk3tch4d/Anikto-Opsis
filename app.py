from flask import Flask, request, render_template, send_file
import os
import uuid
from ARGX_Generator import generate_argx_and_heatmap

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        pdf_paths = []
        for file in request.files.getlist("files"):
            if file.filename.endswith(".pdf"):
                filepath = os.path.join("/tmp", file.filename)
                file.save(filepath)
                pdf_paths.append(filepath)

        if not pdf_paths:
            flash("Please upload at least one PDF file.", "error")
            return redirect(url_for("index"))

        output_files, stats = generate_argx_and_heatmap(pdf_paths)
        return render_template("result.html", outputs=output_files, stats=stats)

    return render_template("index.html")

@app.route("/download/<filename>")
def download(filename):
    print(f"[DOWNLOAD] {filename} requested")
    file_path = os.path.join("/tmp", filename)

    if os.path.exists(file_path):
        return send_file(file_path, as_attachment=True)
    else:
        return "File not found", 404

if __name__ == "__main__":
    app.run(debug=True)
