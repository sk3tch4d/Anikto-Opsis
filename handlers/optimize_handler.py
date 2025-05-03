# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW
# ==============================

import os
import re
import json
from datetime import datetime
from flask import request, render_template, current_app as app
from inventory import load_inventory_data
from inv_optimizer import suggest_rop_roq

# ==============================
# HANDLE REQUEST FOR USL OPTIMIZATION
# ==============================
def handle():
    try:
        # ==============================
        # Get uploaded file
        # ==============================
        file = request.files.getlist("uploads")[0]
        fname_upper = file.filename.upper()

        # ==============================
        # Extract USL code from filename
        # ==============================
        match = re.match(r"KG01-([A-Z0-9]{1,4})", fname_upper)
        if not match:
            return render_template("index.html", error="Invalid USL filename format.")

        usl_code = match.group(1)

        # ==============================
        # OPTIONAL: Validate USL code via static JSON (can skip)
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
        # Save file with datetime in filename
        # ==============================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        save_path = os.path.join("/tmp", f"optimization_{usl_code}_{timestamp}.xlsx")
        file.save(save_path)

        # ==============================
        # Load + Optimize
        # ==============================
        df = load_inventory_data(path=save_path)
        df = suggest_rop_roq(df)
        df.to_excel(save_path, index=False)

        # ==============================
        # Store in shared config + Render
        # ==============================
        import config
        config.OPTIMIZATION_DF = df
        config.OPTIMIZATION_PATH = save_path

        return render_template("optimization.html", table=df.to_dict(orient="records"), download_file=os.path.basename(save_path))

    except Exception as e:
        app.logger.error(f"Optimize handler failed: {e}")
        return render_template("index.html", error="Failed to optimize uploaded file.")
