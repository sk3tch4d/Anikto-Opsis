# ==============================
# INDEX_HANDLER.PY — ROUTING DELEGATOR (REFACTORED)
# ==============================

import re
import os
import logging
import pandas as pd

from flask import request, render_template
from werkzeug.utils import secure_filename
from config import CATALOG_REGEX, SENIORITY_REGEX, USL_OPT_REGEX, ZWDISEG_REGEX

# Modular handlers
from handlers.optimize_handler import handle as handle_optimize
from handlers.seniority_handler import handle as handle_seniority
from handlers.inventory_handler import handle as handle_inventory
from handlers.zwdiseg_handler import handle as handle_zwdiseg
from handlers.cleaner_handler import handle as handle_cleaner

# Cleaner utility
from utils.data_cleaner import (
    clean_xlsx,
    clean_headers,
    clean_columns,
    clean_deleted_rows,
    clean_flags,
    clean_format
)

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
                # Determine cleaning pipeline based on filename
                if re.match(USL_OPT_REGEX, fname, re.IGNORECASE):
                    logging.debug("Matched USL_OPT — using optimize cleaning pipeline")
                    steps = [clean_headers, clean_deleted_rows, clean_flags, clean_columns, clean_format]
                    df = clean_xlsx(file, *steps)
                    return handle_optimize(df)

                elif re.search(SENIORITY_REGEX, fname_lower, re.IGNORECASE):
                    logging.debug("Matched SENIORITY")
                    df = pd.read_excel(file)
                    return handle_seniority(df)

                elif re.search(CATALOG_REGEX, fname_lower, re.IGNORECASE):
                    logging.debug("Matched CATALOG")
                    df = pd.read_excel(file)
                    return handle_inventory(df)

                elif re.search(ZWDISEG_REGEX, fname_lower, re.IGNORECASE):
                    logging.debug("Matched ZWDISEG — using zwdiseg cleaning pipeline")
                    steps = [clean_headers, clean_flags, clean_columns, clean_format]
                    df = clean_xlsx(file, *steps)
                    return handle_zwdiseg(df)

                else:
                    logging.debug("No match — using fallback cleaning pipeline")
                    steps = [clean_headers, clean_columns]
                    df = clean_xlsx(file, *steps)
                    return handle_cleaner(df)

            except Exception as clean_err:
                logging.exception("Cleaning failed")
                return render_template("index.html", error=f"Cleaning failed: {str(clean_err)}")

        # Unknown file type
        return render_template("index.html", error="Unsupported file type.")

    except Exception as e:
        logging.exception("Error during file processing")
        return render_template("index.html", error=f"Unexpected error during routing: {str(e)}")
