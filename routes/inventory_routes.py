# ==============================
# INVENTORY_ROUTES.PY
# ==============================

from flask import Blueprint, request, jsonify
from config import INVENTORY_DF
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
    result = get_inventory_usls(INVENTORY_DF)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result), 200

# ==============================
# INVENTORY SEARCH
# ==============================
@inventory_bp.route("/inventory-search")
def inventory_search():
    return handle_search_request(INVENTORY_DF, search_inventory)
