# ==============================
# INVENTORY_HANDLER.PY — CATALOG/COST CENTER INVENTORY
# ==============================

import os
from flask import render_template, current_app as app
from inventory import load_inventory_data

# ==============================
# PROCESS STANDARD INVENTORY FILE
# ==============================
def handle(file):
    try:
        # ==============================
        # Save uploaded file to /tmp
        # ==============================
        save_path = os.path.join("/tmp", "catalog_uploaded.xlsx")
        file.save(save_path)

        # ==============================
        # Load standard inventory data
        # ==============================
        df = load_inventory_data(path=save_path)

        # ==============================
        # Store for global reference
        # ==============================
        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Inventory catalog handler failed: {e}")
        return render_template("index.html", error="Failed to process inventory catalog file.")
