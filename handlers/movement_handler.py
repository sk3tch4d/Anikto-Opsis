# ==============================
# MOVEMENT_HANDLER.PY
# ==============================

import config
from flask import render_template, current_app as app

# ==============================
# HANDLE MOVEMENT DATAFRAME
# ==============================
def handle(df):
    try:
        # ==============================
        # Store and Render
        # ==============================
        config.MOVEMENT_DF = df

        return render_template("movement.html", table=[])

    except Exception as e:
        app.logger.error(f"Movement handler failed: {e}")
        return render_template("index.html", error="Failed to process movement file.")
