# ==============================
# OPTIMIZATION_ROUTES.PY
# ==============================

import os
import config
from flask import Blueprint, send_file, current_app
from optimization import search_optimization
from utils.data_search import handle_search_request

# ==============================
# SETUP OPTIMIZATION BP
# ==============================

optimization_bp = Blueprint("optimization", __name__)

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

    return handle_search_request(df, search_optimization, default_sort="site_suggested_rop")
