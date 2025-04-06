
from flask import Flask, request, render_template, send_file
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

        output_files = generate_argx_and_heatmap(temp_paths)
        if output_files:
            # Move files to /tmp/ for Flask download if not already
            moved_outputs = []
            for path in output_files:
                dest = os.path.join("/tmp", os.path.basename(path))
                if not os.path.samefile(path, dest):
                    os.rename(path, dest)
                moved_outputs.append(os.path.basename(dest))

            return render_template("result.html", outputs=moved_outputs)
        else:
            return render_template("index.html", error="Something went wrong generating the report.")

    return render_template("index.html")

@app.route("/download/<filename>")
def download(filename):
    return send_file(os.path.join("/tmp", filename), as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)
