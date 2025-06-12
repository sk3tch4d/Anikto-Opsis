# ==============================
# INVENTORY_ROUTES.PY
# ==============================

import os
import config
from flask import Blueprint, request, jsonify, current_app, send_file
from utils.data_search import handle_search_request
from inv_cleaner import clean_xlsx_and_save
from inventory import get_inventory_usls, search_inventory

# ==============================
# SETUP INVENTORY BP
# ==============================

inventory_bp = Blueprint("inventory", __name__)

# ==============================
# INVENTORY USLS
# ==============================
@inventory_bp.route("/inventory-usls")
def inventory_usls():
    df = config.INVENTORY_DF  # dynamic access
    current_app.logger.debug("📦 /inventory-usls route hit")

    if df is None:
        current_app.logger.warning("⚠️ INVENTORY_DF is None.")
        return jsonify({"error": "Inventory data not loaded."}), 400
    else:
        current_app.logger.debug(f"📊 INVENTORY_DF shape: {df.shape}")

    try:
        result = get_inventory_usls(df)
        current_app.logger.debug(f"🧪 USLs result: {result}")

        if isinstance(result, tuple):
            return jsonify(result[0]), result[1]
        return jsonify(result), 200

    except Exception as e:
        current_app.logger.exception("🔥 Error in get_inventory_usls")
        return jsonify({"error": "Failed to retrieve Inventory USLs"}), 500


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

    current_app.logger.debug(f"📥 Query params -> term: '{term}', usl: '{usl}', sort: '{sort}', dir: '{direction}'")

    if df is None:
        current_app.logger.warning("⚠️ INVENTORY_DF is None. Search will likely fail.")
    else:
        current_app.logger.debug(f"📊 INVENTORY_DF shape: {df.shape}")

    try:
        response = handle_search_request(df, search_inventory, default_sort="QTY", filter_param="usl")
        current_app.logger.debug("✅ Search handled successfully")
        return response
    except Exception as e:
        current_app.logger.exception(f"🔥 Exception in inventory_search: {e}")
        return jsonify({"error": "Search failed"}), 500

# ==============================
# INVENTORY CLEANING
# ==============================
@inventory_bp.route("/clean-inventory-xlsx", methods=["POST"])
def clean_inventory_xlsx():
    current_app.logger.debug("🧼 /clean-inventory-xlsx route hit")

    file = request.files.get('file')
    if not file:
        current_app.logger.warning("❌ No file uploaded")
        return jsonify({"error": "No file uploaded"}), 400

    try:
        current_app.logger.debug(f"📄 Received file: {file.filename}")
        tmp_path = clean_xlsx_and_save(file)

        current_app.logger.debug(f"✅ Cleaned file saved at: {tmp_path}")
        response = send_file(tmp_path, as_attachment=True, download_name='cleaned_inventory.xlsx')

        @response.call_on_close
        def cleanup():
            try:
                os.unlink(tmp_path)
                current_app.logger.debug(f"🗑️ Deleted temp file: {tmp_path}")
            except Exception as e:
                current_app.logger.error(f"⚠️ Error deleting temp file: {e}")

        return response

    except ValueError as ve:
        current_app.logger.warning(f"⚠️ ValueError: {ve}")
        return jsonify({"error": str(ve)}), 400
    except Exception as e:
        current_app.logger.exception(f"🔥 Unexpected error cleaning file: {e}")
        return jsonify({"error": str(e)}), 500
