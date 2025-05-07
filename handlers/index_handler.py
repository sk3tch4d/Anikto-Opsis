# ==============================
# INDEX_HANDLER.PY — ROUTING DELEGATOR
# ==============================

import re
import os
import logging
from flask import request, render_template
from werkzeug.utils import secure_filename
from config import CATALOG_REGEX, SENIORITY_REGEX, USL_OPT_REGEX, ZWISEG_REGEX

# Modular handlers
from handlers.optimize_handler import handle as handle_optimize
from handlers.seniority_handler import handle as handle_seniority
from handlers.inventory_handler import handle as handle_inventory
from handlers.zwdiseg_handler import handle as handle_zwdiseg
from handlers.cleaner_handler import handle as handle_cleaner

# Cleaner utility
from utils.data_cleaner import clean_xlsx_and_save

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

        # Excel: Clean and reroute based on cleaned content
        if fname_lower.endswith(".xlsx"):
            logging.debug("Routed to cleaner logic for .xlsx file")
            try:
                cleaned_path, cleaned_fname = clean_xlsx_and_save(file)
                cleaned_fname_lower = cleaned_fname.lower()

                # Reroute after cleaning
                if re.match(USL_OPT_REGEX, cleaned_fname, re.IGNORECASE):
                    logging.debug("Rerouted to optimize handler after cleaning")
                    return handle_optimize(cleaned_path)

                if re.search(SENIORITY_REGEX, cleaned_fname_lower, re.IGNORECASE):
                    logging.debug("Rerouted to seniority handler after cleaning")
                    return handle_seniority(cleaned_path)

                if re.search(CATALOG_REGEX, cleaned_fname_lower, re.IGNORECASE):
                    logging.debug("Rerouted to inventory handler after cleaning")
                    return handle_inventory(cleaned_path)

                if re.search(ZWDISEG_REGEX, cleaned_fname_lower, re.IGNORECASE):
                    logging.debug("Rerouted to zwdiseg handler after cleaning")
                    return handle_zwdiseg(cleaned_path)

                # Fallback Cleaner
                logging.debug("Routed to cleaner handler")
                return handle_cleaner()

            except Exception as clean_err:
                logging.exception("Cleaning failed")
                return render_template("index.html", error=f"Cleaning failed: {str(clean_err)}")

        # Unknown file type
        return render_template("index.html", error="Unsupported file type.")

    except Exception as e:
        logging.exception("Error during file processing")
        return render_template("index.html", error=f"Unexpected error during routing: {str(e)}")
