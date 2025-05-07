# ==============================
# SENIORITY_HANDLER.PY — CUPE SENIORITY LIST FLOW
# ==============================

import os
from flask import request, render_template, current_app as app
from seniority import load_seniority_file

# ==============================
# HANDLE CUPE SENIORITY FILE
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
        # Load seniority data
        # ==============================
        seniority_df = load_seniority_file(save_path)

        # ==============================
        # Render the table view
        # ==============================
        return render_template("seniority.html", table=seniority_df.to_dict(orient="records"))

    except Exception as e:
        app.logger.error(f"Seniority handler failed: {e}")
        return render_template("index.html", error="Failed to process seniority file.")
