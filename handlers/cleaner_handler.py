# ==============================
# CLEANER_HANDLER.PY — DEFAULT CLEANER FLOW
# ==============================

import os
from flask import request, render_template, current_app as app
from inv_cleaner import clean_xlsx_and_save

# ==============================
# HANDLE UNKNOWN XLSX FILE (FALLBACK CLEAN)
# ==============================
def handle():
    try:
        # ==============================
        # Get uploaded file
        # ==============================
        file = request.files.getlist("uploads")[0]

        # ==============================
        # Run cleaner
        # ==============================
        cleaned_path, cleaned_filename = clean_xlsx_and_save(file)

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
