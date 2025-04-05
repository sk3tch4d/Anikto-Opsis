
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
            return "No files uploaded", 400

        temp_paths = []
        for file in uploaded_files:
            filename = f"/tmp/{uuid.uuid4().hex}_{file.filename}"
            file.save(filename)
            temp_paths.append(filename)

        # Run generator
        output_file = generate_argx_and_heatmap(temp_paths)

        # Return download
        if output_file:
            return send_file(output_file, as_attachment=True)
        else:
            return "Failed to generate report", 500

    return '''
    <!doctype html>
    <title>ARGX Upload</title>
    <h1>Upload PDF Files</h1>
    <form method=post enctype=multipart/form-data>
      <input type=file name=pdfs multiple>
      <input type=submit value=Generate>
    </form>
    '''

if __name__ == "__main__":
    app.run(debug=True)
