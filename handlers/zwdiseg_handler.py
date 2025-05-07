# ==============================
# ZWDISEG_HANDLER.PY
# ==============================

from flask import render_template, current_app as app

# ==============================
# HANDLE ZWDISEG DATAFRAME
# ==============================
def handle(df):
    try:
        # ==============================
        # Store in global config and render
        # ==============================
        import config
        config.ZWDISEG_DF = df

        return render_template("zwdiseg.html", table=[])

    except Exception as e:
        app.logger.error(f"Zwdiseg handler failed: {e}")
        return render_template("index.html", error="Failed to process zwdiseg file.")
