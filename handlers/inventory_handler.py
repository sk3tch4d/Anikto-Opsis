# ==============================
# INVENTORY_HANDLER.PY — CATALOG INVENTORY FLOW
# ==============================

import os
from flask import render_template, current_app as app
from inventory import load_inventory_data

# ==============================
# HANDLE STANDARD INVENTORY CATALOG FILE
# ==============================
def handle(file):
    try:
        # ==============================
        # Save file to temp path
        # ==============================
        save_path = os.path.join("/tmp", "catalog_uploaded.xlsx")
        file.save(save_path)

        # ==============================
        # Load inventory dataframe
        # ==============================
        df = load_inventory_data(path=save_path)

        # ==============================
        # Store globally and render inventory view
        # ==============================
        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Inventory catalog handler failed: {e}")
        return render_template("index.html", error="Failed to process inventory catalog file.")
