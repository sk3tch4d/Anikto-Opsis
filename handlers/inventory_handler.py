# ==============================
# INVENTORY_HANDLER.PY — CATALOG INVENTORY FLOW
# ==============================

import os
from flask import request, render_template, current_app as app
from inventory import load_inventory_data

# ==============================
# HANDLE CATALOG/COST CENTER INVENTORY FILE
# ==============================
def handle():
    try:
        # ==============================
        # Get uploaded file
        # ==============================
        file = request.files.getlist("uploads")[0]

        # ==============================
        # Save to temp path
        # ==============================
        save_path = os.path.join("/tmp", "catalog_uploaded.xlsx")
        file.save(save_path)

        # ==============================
        # Load inventory data
        # ==============================
        df = load_inventory_data(path=save_path)

        # ==============================
        # Store in global config and render
        # ==============================
        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Inventory handler failed: {e}")
        return render_template("index.html", error="Failed to process inventory file.")
