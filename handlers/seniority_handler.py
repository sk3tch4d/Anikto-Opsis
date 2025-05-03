# ==============================
# SENIORITY_HANDLER.PY — CUPE SENIORITY LIST FLOW
# ==============================

import os
from flask import render_template, current_app as app
from seniority import load_seniority_file

# ==============================
# HANDLE SENIORITY FILE (CUPE LIST)
# ==============================
def handle(file):
    try:
        # ==============================
        # Save uploaded file to /tmp
        # ==============================
        save_path = os.path.join("/tmp", "seniority_uploaded.xlsx")
        file.save(save_path)

        # ==============================
        # Load seniority data
        # ==============================
        seniority_df = load_seniority_file(save_path)

        # ==============================
        # Render the seniority view
        # ==============================
        return render_template("seniority.html", table=seniority_df.to_dict(orient="records"))

    except Exception as e:
        app.logger.error(f"Seniority handler failed: {e}")
        return render_template("index.html", error="Failed to process seniority file.")
