# ==============================
# CLEANER_HANDLER.PY — DEFAULT CLEANER FLOW (REFACTORED)
# ==============================

import os
from datetime import datetime
from flask import render_template, current_app as app
from utils.data_cleaner import save_cleaned_df, schedule_file_deletion

# ==============================
# HANDLE CLEANING XLSX FILE
# ==============================
def handle(df, original_filename):
    try:

        base_name = os.path.splitext(original_filename)[0]
        safe_base = "".join(c for c in base_name if c.isalnum() or c in ('_', '-'))
        friendly_name = f"Cleaned_{safe_base}.xlsx"

        cleaned_path = save_cleaned_df(df, filename=friendly_name)
        schedule_file_deletion(cleaned_path, delay_seconds=600)
        download_link = f"/download/{friendly_name}"

        return render_template("index.html", download_link=download_link)
        

    except Exception as e:
        app.logger.error(f"Cleaner handler failed: {e}")
        return render_template("index.html", error="Failed to clean uploaded file.")

