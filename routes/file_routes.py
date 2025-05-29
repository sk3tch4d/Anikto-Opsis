# ==============================
# FILE_ROUTES.PY
# ==============================

import os
from flask import Blueprint, send_file, current_app

# ==============================
# SETUP FILE BP
# ==============================

file_bp = Blueprint("file", __name__)

# ==============================
# FILE ROUTING
# ==============================
@file_bp.route("/download/<filename>")
def download(filename):
    current_app.logger.debug(f"📦 Download request for: {filename}")

    # Security check: prevent directory traversal
    if ".." in filename or filename.startswith("/"):
        current_app.logger.warning(f"⛔ Suspicious filename: {filename}")
        return "Invalid filename", 400

    file_path = os.path.join("/tmp", filename)

    if os.path.exists(file_path):
        current_app.logger.debug(f"✅ File found at: {file_path}")
        return send_file(file_path, as_attachment=True)

    current_app.logger.warning(f"❌ File not found: {file_path}")
    return "File not found", 404
