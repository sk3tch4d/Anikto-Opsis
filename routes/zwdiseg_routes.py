# ==============================
# ZWDISEG_ROUTES.PY
# ==============================

from flask import Blueprint, jsonify
from config import ZWDISEG_DF
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
    result = get_zwdiseg_usls(ZWDISEG_DF)
    if isinstance(result, tuple):
        return jsonify(result[0]), result[1]
    return jsonify(result), 200

# ==============================
# ZWDISEG SEARCH
# ==============================
@zwdiseg_bp.route("/zwdiseg-search")
def zwdiseg_search():
    return handle_search_request(ZWDISEG_DF, search_zwdiseg)
