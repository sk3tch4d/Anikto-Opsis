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
def handle(df, filename=None):
    try:
        app.logger.debug(f"[OPTIMIZER] Columns available: {df.columns.tolist()}")

        first_usl = df["USL"].dropna().astype(str).str.upper().iloc[0] if "USL" in df.columns else None
        app.logger.debug(f"[OPTIMIZER] USL value: {first_usl}")

        if "USL" not in df.columns:
            app.logger.warning(f"[OPTIMIZER] Missing 'USL' column in file — available: {df.columns.tolist()}")

        # ============== USL Check =================
        match = re.match(r"([A-Z0-9]{1,4})", first_usl) if first_usl else None
        if not match:
            app.logger.debug("[OPTIMIZER] Error: Invalid or missing USL format in data")
            return render_template("index.html", error="Invalid File. Please use a valid Optimization Report File.")

        app.logger.info("[OPTIMIZER] Valid USL Name Check")
        usl_code = match.group(1)

        # ============== Filename USL Check =================
        if filename:
            pattern = rf"KG01[-_]?{usl_code}"
            if not re.search(pattern, filename, re.IGNORECASE):
                app.logger.warning(f"[OPTIMIZER] USL '{usl_code}' not found in filename '{filename}' — pattern: '{pattern}'")
                return render_template("index.html", error="Filename does not match USL code in file contents.")

            app.logger.info(f"[OPTIMIZER] USL: '{usl_code}'  Correctly Matched: '{filename}'")

        # ============== Optional USL List Validation =================
        try:
            with open("static/usl_list.json") as f:
                usl_list = json.load(f)
            valid_usls = {entry["usl"] for entry in usl_list}
        except Exception as e:
            app.logger.error(f"Failed to load USL json list: {e}")
            return render_template("index.html", error="Could not load USL list.")

        if usl_code not in valid_usls:
            app.logger.error(f"Failed to match USL from list {e}")
            return render_template("index.html", error=f"USL '{usl_code}' not recognized.")

        # ============== Optimize =================
        df = suggest_rop_roq(df)

        # ============== Save Output =================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        opt_path = os.path.join("/tmp", f"optimization_{usl_code}_{timestamp}_optimized.xlsx")
        df.to_excel(opt_path, index=False)

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
