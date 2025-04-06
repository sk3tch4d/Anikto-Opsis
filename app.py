from flask import Flask, request, render_template, send_file
import os
import uuid
from ARGX_Generator import generate_argx_and_heatmap

UPLOAD_FOLDER = "/tmp/uploads"
MAX_PDFS = 30

# Ensure folder exists at startup
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        uploaded_files = request.files.getlist("pdfs")
        if not uploaded_files:
            return render_template("index.html", error="No files uploaded.")

        temp_paths = []
        for file in uploaded_files:
            if file.filename.endswith(".pdf"):
                filename = f"{uuid.uuid4().hex}_{file.filename}"
                save_path = os.path.join(UPLOAD_FOLDER, filename)
                file.save(save_path)
                temp_paths.append(save_path)

        output_files, stats = generate_argx_and_heatmap(temp_paths)

        if output_files:
            filenames = [os.path.basename(path) for path in output_files]
            return render_template("result.html", outputs=filenames, stats=stats)
        else:
            return render_template("index.html", error="Something went wrong generating the report.")

        # === GET method ===
        recent_pdfs = sorted(
            [f for f in os.listdir(UPLOAD_FOLDER) if f.endswith(".pdf")],
            key=lambda f: os.path.getmtime(os.path.join(UPLOAD_FOLDER, f)),
            reverse=True)[:MAX_PDFS]

        return render_template("index.html", recent_pdfs=recent_pdfs)


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
