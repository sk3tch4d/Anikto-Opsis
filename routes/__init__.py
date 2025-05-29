# ==============================
# __INIT__.PY MAIN ROUTE HANDLER
# ==============================

import os
import re
import config
import numpy as np
from datetime import datetime
from flask import (
    request,
    render_template,
    jsonify,
    send_file,
    redirect, 
    session, 
    url_for,
)
from config import UPLOAD_FOLDER
from config import DEV_MODE
from utils.data_search import handle_search_request
from seniority import load_seniority_file
from optimization import search_optimization
from handlers.index_handler import process_index_upload

from .file_routes import file_bp
from .dev_routes import dev_bp
from .inventory_routes import inventory_bp
from .zwdiseg_routes import zwdiseg_bp

# ==============================
# ENSURE UPLOAD FOLDER EXISTS
# ==============================
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# REGISTER APPLICATION ROUTES
# ==============================
def register_routes(app):

    # ==============================
    # REGISTER BLUEPRINTS
    # ==============================
    app.register_blueprint(file_bp)
    app.register_blueprint(dev_bp)
    app.register_blueprint(inventory_bp)
    app.register_blueprint(zwdiseg_bp)
    
    # ==============================
    # INDEX HANDLING: POST & GET
    # ==============================
    @app.route("/", methods=["GET"])
    def index():
        return render_template("index.html")
    # ==============================
    @app.route("/", methods=["POST"])
    def post_index():
        return process_index_upload()

    # ==============================
    # OPTIMIZATION API ROUTES
    # ==============================
    @app.route("/download/optimized")
    def download_optimized():
        path = config.OPTIMIZATION_PATH
        if path and os.path.exists(path):
            return send_file(path, as_attachment=True, download_name=os.path.basename(path))
        return "Optimized file not available.", 404
    # ==============================
    @app.route("/optimization-search")
    def optimization_search():
        return handle_search_request(config.OPTIMIZATION_DF, search_optimization, default_sort="site_suggested_rop")

    # ==============================
    # REORDER NAMES FOR ARG
    # ==============================
    @app.template_filter("reorder_name")
    def reorder_name(value):
        """Reorders 'Last, First' to 'First Last' if applicable."""
        current_app.logger.debug(f"🔃 Applying reorder_name filter on: '{value}'")
        parts = value.split(", ")
        if len(parts) == 2:
            reordered = f"{parts[1]} {parts[0]}"
            current_app.logger.debug(f"✅ Reordered to: '{reordered}'")
            return reordered
        current_app.logger.debug("⚠️ Value did not match 'Last, First' format")
        return value

    # ==============================
    # REDIRECT ROUTES
    # ==============================
    @app.route("/1902")
    def panel():
        return render_template("panel.html")
    # ==============================
    @app.route("/61617")
    def inventory():
        return render_template("inventory.html", table=[])
    # ==============================
    @app.route("/test")
    def testing():
        return render_template("testing.html", table=[])
