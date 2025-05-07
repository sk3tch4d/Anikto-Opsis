# ==============================
# CLEANER_HANDLER.PY — DEFAULT CLEANER FLOW (REFACTORED)
# ==============================

import os
from datetime import datetime
from flask import render_template, current_app as app
from utils.data_cleaner import save_cleaned_df

# ==============================
# HANDLE UNKNOWN XLSX FILE (FALLBACK CLEAN)
# ==============================
def handle(df):
    try:
        # ==============================
        # Save cleaned DataFrame to /tmp with a generic filename
        # ==============================
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        cleaned_path = save_cleaned_df(df)
        cleaned_filename = os.path.basename(cleaned_path)

        # ==============================
        # Provide cleaned file for download
        # ==============================
        download_link = f"/download/{cleaned_filename}"
        return render_template(
            "index.html",
            message="File cleaned successfully!",
            download_link=download_link
        )

    except Exception as e:
        app.logger.error(f"Cleaner handler failed: {e}")
        return render_template("index.html", error="Failed to clean uploaded file.")
