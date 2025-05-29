# ==============================
# __INIT__.PY MAIN ROUTE HANDLER
# ==============================

import os

from flask import (
    request, render_template, jsonify, send_file,
    redirect, session, url_for, current_app,
)

import config
from config import DEV_MODE, UPLOAD_FOLDER

from utils.data_tools import reorder_name
from utils.data_search import handle_search_request
from handlers.index_handler import process_index_upload

from .arg_routes import arg_bp
from .dev_routes import dev_bp
from .file_routes import file_bp
from .inventory_routes import inventory_bp
from .optimization_routes import optimization_bp
from .zwdiseg_routes import zwdiseg_bp

# ==============================
# ENSURE UPLOAD FOLDER EXISTS
# ==============================
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ==============================
# REGISTER APPLICATION ROUTES
# ==============================
def register_routes(app):
    app.logger.debug("🚀 Initializing application routes and filters")

    # ==============================
    # REGISTER BLUEPRINTS
    # ==============================
    blueprints = [arg_bp, file_bp, dev_bp, inventory_bp, optimization_bp, zwdiseg_bp]
    for bp in blueprints:
        app.register_blueprint(bp)
        app.logger.debug(f"🔗 Registered Blueprint: {bp.name}")

    # ==============================
    # ADD TEMPLATE FILTERS
    # ==============================
    template_filters = {"reorder_name": reorder_name}
    for name, func in template_filters.items():
        app.add_template_filter(func, name=name)
        app.logger.debug(f"🔗 Added Template Filter: {name}")
    
    # ==============================
    # INDEX HANDLING: POST & GET
    # ==============================
    @app.route("/", methods=["GET"])
    def index():
        current_app.logger.debug("📥 GET / — Rendering index.html")
        return render_template("index.html")

    @app.route("/", methods=["POST"])
    def post_index():
        current_app.logger.debug("📤 POST / — Handling index upload")
        return process_index_upload()

    # ==============================
    # REDIRECT ROUTES
    # ==============================
    @app.route("/1902")
    def panel():
        current_app.logger.debug("🧭 /1902 route hit — Rendering panel.html")
        return render_template("panel.html")

    @app.route("/61617")
    def inventory():
        current_app.logger.debug("🧾 /61617 route hit — Rendering inventory.html")
        return render_template("inventory.html", table=[])

    @app.route("/test")
    def testing():
        current_app.logger.debug("🧪 /test route hit — Rendering testing.html")
        return render_template("testing.html", table=[])
