# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW
# ==============================

import os
import re
import json
from flask import request, render_template, current_app as app
from inventory import load_inventory_data
from inv_optimizer import suggest_rop_roq

# ==============================
# HANDLE REQUEST FOR USL OPTIMIZATION
# ==============================
def handle():
    try:
        # ==============================
        # Grab the uploaded file
        # ==============================
        file = request.files.getlist("uploads")[0]
        fname_upper = file.filename.upper()

        # ==============================
        # Validate filename format
        # ==============================
        match = re.match(r"KG01-([A-Z]+)", fname_upper)
        if not match:
            return render_template("index.html", error="Invalid USL filename format.")

        usl_code = match.group(1)

        # ==============================
        # Check if USL is valid
        # ==============================
        try:
            with open("static/usl_list.json") as f:
                usl_list = json.load(f)
            valid_usls = {entry["usl"] for entry in usl_list}
        except Exception as e:
            app.logger.error(f"Failed to load USL list: {e}")
            return render_template("index.html", error="Could not load USL list.")

        if usl_code not in valid_usls:
            return render_template("index.html", error=f"USL '{usl_code}' not recognized.")

        # ==============================
        # Save the file
        # ==============================
        save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
        file.save(save_path)

        # ==============================
        # Load and optimize
        # ==============================
        df = load_inventory_data(path=save_path)
        df = suggest_rop_roq(df)

        # ==============================
        # Store globally and render
        # ==============================
        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Optimize handler failed: {e}")
        return render_template("index.html", error="Failed to optimize uploaded file.")
