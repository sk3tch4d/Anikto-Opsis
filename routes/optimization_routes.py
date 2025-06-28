# ==============================
# OPTIMIZATION_ROUTES.PY
# ==============================

import os
import config
from flask import Blueprint, send_file, current_app, jsonify
from optimization import search_optimization
from utils.data_search import handle_search_request

# ==============================
# SETUP OPTIMIZATION BP
# ==============================

optimization_bp = Blueprint("optimization", __name__)

# ==============================
# OPTIMIZATION CARTS
# ==============================
@optimization_bp.route("/optimization-carts")
def optimization_carts():
    df = config.OPTIMIZATION_DF  # dynamic reference like INVENTORY_DF
    current_app.logger.debug("🛒 /optimization-carts route hit")

    if df is None:
        current_app.logger.warning("⚠️ OPTIMIZATION_DF is None.")
        return jsonify({"error": "Optimization data not loaded."}), 400

    try:
        # Assume there's a column named "Cart" or similar in DF
        carts = sorted(df["Cart"].dropna().unique().tolist())
        current_app.logger.debug(f"🧪 Carts extracted: {carts}")
        return jsonify(carts), 200

    except Exception as e:
        current_app.logger.exception("🔥 Error getting cart list")
        return jsonify({"error": "Failed to retrieve cart list"}), 500

# ==============================
# DOWNLOAD HEURISTIC FILE
# ==============================
@optimization_bp.route("/download/printable")
def download_heuristic():
    try:
        path = config.HEURISTIC_FILE_PATH
        if not path or not os.path.exists(path):
            return "No heuristic file available", 404
        return send_file(path, as_attachment=True, download_name=os.path.basename(path))
    except Exception as e:
        logging.error(f"[DOWNLOAD] Heuristc Download Failed: {e}")
        return "Error downloading heuristic file", 500

# ==============================
# DOWNLOAD PRINTABLE FILE
# ==============================
@optimization_bp.route("/download/printable")
def download_printable():
    try:
        path = config.PRINTABLE_FILE_PATH
        if not path or not os.path.exists(path):
            return "No printable file available", 404
        return send_file(path, as_attachment=True, download_name=os.path.basename(path))
    except Exception as e:
        logging.error(f"[DOWNLOAD] Printable download failed: {e}")
        return "Error downloading printable", 500

# ==============================
# DOWNLOAD OPTIMIZED FILE
# ==============================
@optimization_bp.route("/download/optimized")
def download_optimized():
    current_app.logger.debug("⬇️ /download/optimized route hit")
    path = config.OPTIMIZATION_PATH

    if path and os.path.exists(path):
        current_app.logger.debug(f"📁 Found optimized file at: {path}")
        return send_file(path, as_attachment=True, download_name=os.path.basename(path))

    current_app.logger.warning("❌ Optimized file not available")
    return "Optimized file not available.", 404

# ==============================
# OPTIMIZATION SEARCH DATA
# ==============================
@optimization_bp.route("/optimization-search")
def optimization_search():
    current_app.logger.debug("🔍 /optimization-search route hit")
    df = config.OPTIMIZATION_DF

    if df is None:
        current_app.logger.warning("⚠️ OPTIMIZATION_DF is None. Search will likely fail.")
    else:
        current_app.logger.debug(f"📊 OPTIMIZATION_DF shape: {df.shape}")

    return handle_search_request(df, search_optimization, default_sort="Num", filter_param="cart")
