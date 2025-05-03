# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW
# ==============================

import os
import re
import json
from flask import render_template, current_app as app
from inventory import load_inventory_data
from inv_optimizer import suggest_rop_roq

# ==============================
# HANDLE USL INVENTORY FILE FOR ROP/ROQ OPTIMIZATION
# ==============================
def handle(file):
    try:
        # ==============================
        # Extract USL from filename (e.g., KG01-INTA-XYZ.xlsx)
        # ==============================
        fname_upper = file.filename.upper()
        match = re.match(r"KG01-([A-Z]+)", fname_upper)
        if not match:
            return render_template("index.html", error="Filename does not match USL format.")

        usl_code = match.group(1)

        # ==============================
        # Load valid USLs from JSON
        # ==============================
        with open("static/usl_list.json") as f:
            usl_list = json.load(f)
            valid_usls = {entry["usl"] for entry in usl_list}

        if usl_code not in valid_usls:
            return render_template("index.html", error=f"USL '{usl_code}' not recognized.")

        # ==============================
        # Save file and process inventory
        # ==============================
        save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
        file.save(save_path)

        df = load_inventory_data(path=save_path)
        df = suggest_rop_roq(df)

        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Optimize handler failed: {e}")
        return render_template("index.html", error="Failed to process USL optimization file.")
