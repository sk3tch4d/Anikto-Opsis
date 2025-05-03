# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW
# ==============================

import os
import re
import json
import pandas as pd
from datetime import datetime
from flask import request, render_template, current_app as app
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
        # Save uploaded file (raw)
        # ==============================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        raw_path = os.path.join("/tmp", f"optimization_{usl_code}_{timestamp}_raw.xlsx")
        file.save(raw_path)

        # ==============================
        # Load XLSX from header row 10
        # ==============================
        df = pd.read_excel(raw_path, header=9)

        # Normalize headers: lowercase + underscores
        df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

        # ==============================
        # Run optimization logic
        # ==============================
        df = suggest_rop_roq(df)

        # ==============================
        # Save optimized output
        # ==============================
        opt_path = os.path.join("/tmp", f"optimization_{usl_code}_{timestamp}_optimized.xlsx")
        df.to_excel(opt_path, index=False)

        # ==============================
        # Store in config + return UI
        # ==============================
        import config
        config.OPTIMIZATION_DF = df
        config.OPTIMIZATION_PATH = opt_path

        return render_template(
            "optimization.html",
            table=df.to_dict(orient="records"),
            download_file=os.path.basename(opt_path)
        )

    except Exception as e:
        app.logger.error(f"Optimize handler failed: {e}")
        return render_template("index.html", error="Failed to optimize uploaded file.")
