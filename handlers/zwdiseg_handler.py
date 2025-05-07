# ==============================
# ZWDISEG_HANDLER.PY
# ==============================

import os
from flask import request, render_template, current_app as app
from zwdiseg import load_zwdiseg_data

# ==============================
# HANDLE ZWDISEG FILE
# ==============================
def handle():
    try:
        # ==============================
        # Get uploaded file
        # ==============================
        file = request.files.getlist("uploads")[0]

        # ==============================
        # Save to temp path
        # ==============================
        save_path = os.path.join("/tmp", "zwdiseg_uploaded.xlsx")
        file.save(save_path)

        # ==============================
        # Load Zwdiseg data
        # ==============================
        df = load_zwdiseg_data(path=save_path)

        # ==============================
        # Store in global config and render
        # ==============================
        import config
        config.ZWDISEG_DF = df

        return render_template("zwdiseg.html", table=[])

    except Exception as e:
        app.logger.error(f"Zwdiseg handler failed: {e}")
        return render_template("index.html", error="Failed to process zwdiseg file.")
