# ==============================
# INDEX_HANDLER.PY — ROUTING DELEGATOR
# ==============================

import re
from flask import request, render_template
from config import CATALOG_REGEX, SENIORITY_REGEX, USL_OPT_REGEX

# Modular handlers
from handlers.optimize_handler import handle as handle_optimize
from handlers.seniority_handler import handle as handle_seniority
from handlers.inventory_handler import handle as handle_inventory
from handlers.cleaner_handler import handle as handle_cleaner

# ==============================
# MAIN ENTRYPOINT — ROUTE BASED ON FILE TYPE
# ==============================
def process_index_upload():
    try:
        uploaded_files = request.files.getlist("uploads")
        if not uploaded_files:
            return render_template("index.html", error="No files uploaded.")

        file = uploaded_files[0]
        fname = file.filename
        fname_lower = fname.lower()
        fname_upper = fname.upper()

        if fname.endswith(".pdf"):
            from report import process_report
            save_path = f"/tmp/{fname}"
            file.save(save_path)
            output_files, stats = process_report([save_path])
            return render_template("arg.html", outputs=[fname], stats=stats)

        if re.match(USL_OPT_REGEX, fname_upper):
            return handle_optimize()

        if re.search(SENIORITY_REGEX, fname_lower, re.IGNORECASE):
            return handle_seniority()

        if re.search(CATALOG_REGEX, fname_lower, re.IGNORECASE):
            return handle_inventory()

        return handle_cleaner()

    except Exception as e:
        return render_template("index.html", error=f"Unexpected error during routing: {str(e)}")
