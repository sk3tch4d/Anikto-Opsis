# ==============================
# INDEX_HANDLER.PY — ROUTING DELEGATOR
# ==============================

import re
import os
import logging
from flask import request, render_template
from werkzeug.utils import secure_filename
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
        fname = secure_filename(file.filename)
        fname_lower = fname.lower()

        logging.debug(f"Uploaded file: {fname}")

        # PDF: Flowsheet / ARG
        if fname_lower.endswith(".pdf"):
            from report import process_report
            match = re.search(r"\d{4}-\d{2}-\d{2}", fname)
            date_str = match.group() if match else "unknown"
            pdf_name = f"ARG_{date_str}.pdf"

            save_path = os.path.join("/tmp", pdf_name)
            file.save(save_path)
            logging.debug(f"Saved uploaded PDF as: {save_path}")

            output_files, stats = process_report([save_path])
            output_filenames = [os.path.basename(f) for f in output_files]
            if pdf_name not in output_filenames:
                output_filenames.append(pdf_name)

            return render_template("arg.html", outputs=output_filenames, stats=stats)
    
        # USL Optimizer: KG01-XXXX-*.xlsx
        if re.match(USL_OPT_REGEX, fname, re.IGNORECASE):
            logging.debug("Routed to optimize handler")
            return handle_optimize()

        # Seniority List
        if re.search(SENIORITY_REGEX, fname_lower, re.IGNORECASE):
            logging.debug("Routed to seniority handler")
            return handle_seniority()

        # Inventory Catalog
        if re.search(CATALOG_REGEX, fname_lower, re.IGNORECASE):
            logging.debug("Routed to inventory handler")
            return handle_inventory()

        # Fallback Cleaner
        logging.debug("Routed to cleaner handler")
        return handle_cleaner()

    except Exception as e:
        logging.exception("Error during file processing")
        return render_template("index.html", error=f"Unexpected error during routing: {str(e)}")
