# ==============================
# INVENTORY_HANDLER.PY — CATALOG INVENTORY FLOW
# ==============================

import os
from flask import request, render_template, current_app as app
from inventory import load_inventory_data

# ==============================
# HANDLE CATALOG/COST CENTER INVENTORY FILE
# ==============================
def handle(cleaned_path=None):
    try:
        # ==============================
        # Determine file source
        # ==============================
        if cleaned_path:
            save_path = cleaned_path
        else:
            file = request.files.getlist("uploads")[0]
            save_path = os.path.join("/tmp", "some_name.xlsx")
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
