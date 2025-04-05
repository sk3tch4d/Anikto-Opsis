
from flask import Flask, request, render_template, send_file, redirect, url_for
import os
import uuid
from ARGX_Generator import generate_argx_and_heatmap

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        uploaded_files = request.files.getlist("pdfs")
        if not uploaded_files:
            return render_template("index.html", error="No files uploaded.")

        temp_paths = []
        for file in uploaded_files:
            filename = f"/tmp/{uuid.uuid4().hex}_{file.filename}"
            file.save(filename)
            temp_paths.append(filename)

        output_file = generate_argx_and_heatmap(temp_paths)

        if output_file:
            filename = os.path.basename(output_file)
            return render_template("result.html", filename=filename)
        else:
            return render_template("index.html", error="Something went wrong generating the report.")

    return render_template("index.html")

@app.route("/download/<filename>")
def download(filename):
    path = os.path.join("/tmp", filename)
    return send_file(path, as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
