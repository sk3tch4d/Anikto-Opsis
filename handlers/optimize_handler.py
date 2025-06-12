# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW (MATCHING INVENTORY STRUCTURE)
# ==============================

import os
import re
import json
import config
import pandas as pd
from datetime import datetime
from flask import render_template, current_app as app
from inv_optimizer import suggest_rop_roq

# ==============================
# HANDLE REQUEST FOR USL OPTIMIZATION
# ==============================
def handle(df, filename=None):
    try:
        app.logger.debug(f"[OPTIMIZER] Columns available: {df.columns.tolist()}")

        if "USL" not in df.columns or df["USL"].dropna().empty:
            raise ValueError("Missing or empty 'USL' column")

        first_usl = df["USL"].dropna().astype(str).str.upper().iloc[0]
        match = re.match(r"([A-Z0-9]{1,4})", first_usl)
        if not match:
            return render_template("index.html", error="Invalid USL format in file.")
        usl_code = match.group(1)

        if filename:
            pattern = rf"KG01[-_]?{usl_code}"
            if not re.search(pattern, filename, re.IGNORECASE):
                return render_template("index.html", error="Filename does not match USL code in contents.")

        try:
            with open("static/usl_list.json") as f:
                valid_usls = {entry["usl"] for entry in json.load(f)}
            if usl_code not in valid_usls:
                return render_template("index.html", error=f"USL '{usl_code}' not recognized.")
        except Exception as e:
            app.logger.error(f"USL list load failed: {e}", exc_info=True)
            return render_template("index.html", error="Could not load USL list.")

        # ===================== OPTIMIZE =====================
        df = suggest_rop_roq(df)

        numeric_cols = ["ROP", "ROQ", "RROP", "RROQ", "SROP", "SROQ", "Num", "QTY", "CU1", "CU2"]
        for col in numeric_cols:
            if col in df.columns:
                df[col] = pd.to_numeric(df[col], errors="coerce")

        required_cols = ["Bin", "ROP", "ROQ", "Num"]
        df = df.dropna(subset=required_cols)

        # ===================== SAVE + REGISTER =====================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        saved_path = os.path.join("/tmp", f"optimization_{usl_code}_{timestamp}_optimized.xlsx")
        df.to_excel(saved_path, index=False)

        config.OPTIMIZATION_DF = df
        config.OPTIMIZATION_PATH = saved_path

        # ===================== RENDER =====================
        return render_template(
            "optimization.html",
            table=df.to_dict(orient="records"),
            download_file=os.path.basename(saved_path)
        )

    except Exception as e:
        app.logger.error(f"[OPTIMIZER] Handler Failed: {e}", exc_info=True)
        safe_table = df.where(pd.notnull(df), None).to_dict(orient="records")
        return render_template("optimization.html", table=safe_table, download_file=None)
