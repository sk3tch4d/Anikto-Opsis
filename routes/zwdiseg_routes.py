# ==============================
# ZWDISEG_ROUTES.PY
# ==============================

import config
from flask import Blueprint, jsonify, request, current_app
from zwdiseg import get_zwdiseg_usls, search_zwdiseg
from utils.data_search import handle_search_request

# ==============================
# SETUP ZWDISEG BP
# ==============================

zwdiseg_bp = Blueprint("zwdiseg", __name__)

# ==============================
# ZWDISEG USLS
# ==============================
@zwdiseg_bp.route("/zwdiseg-usls")
def zwdiseg_usls():
    df = config.ZWDISEG_DF  # dynamic access
    current_app.logger.debug("📦 /zwdiseg-usls route hit")

    if df is None:
        current_app.logger.warning("⚠️ ZWDISEG_DF is None.")
        return jsonify({"error": "ZWDISEG data not loaded."}), 400
    else:
        current_app.logger.debug(f"📊 ZWDISEG_DF shape: {df.shape}")

    try:
        result = get_zwdiseg_usls(df)
        current_app.logger.debug(f"🧪 USLs result: {result}")

        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result), 200

    except Exception as e:
        current_app.logger.exception("🔥 Error in get_zwdiseg_usls")
        return jsonify({"error": "Failed to retrieve ZWDISEG USLs"}), 500


# ==============================
# ZWDISEG SEARCH
# ==============================
@zwdiseg_bp.route("/zwdiseg-search")
def zwdiseg_search():
    df = config.ZWDISEG_DF  # dynamic access
    current_app.logger.debug("🔍 /zwdiseg-search route hit")

    term = request.args.get("term", "")
    usl = request.args.get("usl", "")
    sort = request.args.get("sort", "")
    direction = request.args.get("dir", "")

    current_app.logger.debug(f"📥 Query params -> term: '{term}', usl: '{usl}', sort: '{sort}', dir: '{direction}'")

    if df is None:
        current_app.logger.warning("⚠️ ZWDISEG_DF is None. Search will likely fail.")
    else:
        current_app.logger.debug(f"📊 ZWDISEG_DF shape: {df.shape}")

    try:
        response = handle_search_request(df, search_zwdiseg)
        current_app.logger.debug("✅ Search handled successfully")
        return response
    except Exception as e:
        current_app.logger.exception(f"🔥 Exception in zwdiseg_search: {e}")
        return jsonify({"error": "Search failed"}), 500

