# ==============================
# INVENTORY_ROUTES.PY
# ==============================

import config
from flask import Blueprint, request, jsonify, current_app
from inventory import get_inventory_usls, search_inventory
from utils.data_search import handle_search_request

# ==============================
# SETUP INVENTORY BP
# ==============================

inventory_bp = Blueprint("inventory", __name__)

# ==============================
# INVENTORY USLS
# ==============================
@inventory_bp.route("/inventory-usls")
def inventory_usls():
    df = config.INVENTORY_DF  # Dynamic reference
    current_app.logger.debug("📦 /inventory-usls route hit")
    result = get_inventory_usls(df)
    current_app.logger.debug(f"🧪 USLs result: {result}")

    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result), 200

# ==============================
# INVENTORY SEARCH
# ==============================
@inventory_bp.route("/inventory-search")
def inventory_search():
    df = config.INVENTORY_DF  # Dynamic reference
    current_app.logger.debug("🔍 /inventory-search route hit")
    term = request.args.get("term", "")
    usl = request.args.get("usl", "")
    sort = request.args.get("sort", "")
    direction = request.args.get("dir", "")
    current_app.logger.debug(f"Query params -> term: {term}, usl: {usl}, sort: {sort}, dir: {direction}")
    
    return handle_search_request(df, search_inventory)
