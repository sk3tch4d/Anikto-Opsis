# ==============================
# INVENTORY_HANDLER.PY — USL OPTIMIZER FLOW
# ==============================

import os
import json
from flask import render_template, current_app as app
from inventory import load_inventory_data
from inv_optimizer import suggest_rop_roq

# ==============================
# PROCESS INVENTORY FILE FOR USL OPTIMIZATION
# ==============================
def handle(file):
    try:
        # ==============================
        # Save uploaded file to /tmp
        # ==============================
        save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
        file.save(save_path)

        # ==============================
        # Load and run optimization
        # ==============================
        df = load_inventory_data(path=save_path)
        df = suggest_rop_roq(df)

        # ==============================
        # Store globally and render inventory table
        # ==============================
        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Inventory handler failed: {e}")
        return render_template("index.html", error="Failed to process inventory file.")
