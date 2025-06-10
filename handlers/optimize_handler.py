# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW (REFACTORED)
# ==============================

import os
import re
import json
from datetime import datetime
from flask import render_template, current_app as app
from inv_optimizer import suggest_rop_roq

# ==============================
# HANDLE REQUEST FOR USL OPTIMIZATION
# ==============================
def handle(df):
    try:
        # ==============================
        # Extract USL code from column or fallback filename (assume passed separately if needed)
        # ==============================
        app.logger.debug(f"[OPTIMIZER] Columns available: {df.columns.tolist()}")

        first_usl = df["USL"].dropna().astype(str).str.upper().iloc[0] if "USL" in df.columns else None
        app.logger.debug(f"[OPTIMIZER] USL value: {first_usl}")

        if "USL" not in df.columns:
            app.logger.warning(f"[OPTIMIZER] Missing 'USL' column in file — available: {df.columns.tolist()}")
        
        match = re.match(r"([A-Z0-9]{1,4})", first_usl) if first_usl else None
        if not match:
            app.logger.debug(f"[OPTIMIZER] Error: Invalid or missing USL format in data")
            return render_template("index.html", error="Invalid File. Please use a valid Optimizaton Report File.")

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
        # Run optimization logic
        # ==============================
        df = suggest_rop_roq(df)

        # ==============================
        # Save optimized output
        # ==============================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
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
