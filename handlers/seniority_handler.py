# ==============================
# SENIORITY_HANDLER.PY — CUPE SENIORITY LIST FLOW (REFACTORED)
# ==============================

from flask import render_template, current_app as app

# ==============================
# HANDLE CUPE SENIORITY DATAFRAME
# ==============================
def handle(df):
    try:
        # ==============================
        # Render the table view
        # ==============================
        return render_template("seniority.html", table=df.to_dict(orient="records"))

    except Exception as e:
        app.logger.error(f"Seniority handler failed: {e}")
        return render_template("index.html", error="Failed to process seniority file.")
