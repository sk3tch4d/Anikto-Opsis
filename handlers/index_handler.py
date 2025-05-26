
# ==============================
# INDEX_HANDLER.PY
# FILE ROUTING & DELEGATION
# ==============================

import re
import os
import logging
import pandas as pd
import sqlite3

from flask import request, render_template
from werkzeug.utils import secure_filename
from config import CATALOG_REGEX, SENIORITY_REGEX, OPTIMIZE_REGEX, ZWDISEG_REGEX, CLEAN_REGEX

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
    clean_format,
    clean_db
)

# ==============================
# SHARED .XLSX HANDLER
# ROUTES EXCEL BASED ON CONTENT
# ==============================
def handle_excel_file(file, fname):
    fname_lower = fname.lower()

    # DETERMINE CLEANING PIPELINE
    if re.match(CLEAN_REGEX, fname, re.IGNORECASE):
        logging.debug("[HANDLER] Matched CLEAN — using optimize cleaning pipeline")
        steps = [clean_headers, clean_columns, clean_deleted_rows, clean_flags, clean_format]
        df = clean_xlsx(file, *steps, name=fname, multi_sheet=False)
        return handle_cleaner(df)

    elif re.match(OPTIMIZE_REGEX, fname, re.IGNORECASE):
        logging.debug("[HANDLER] Matched OPTIMIZE — using optimize cleaning pipeline")
        steps = [clean_headers, clean_deleted_rows, clean_flags, clean_columns, clean_format]
        df = clean_xlsx(file, *steps, name=fname, multi_sheet=False)
        return handle_optimize(df)

    elif re.search(SENIORITY_REGEX, fname_lower, re.IGNORECASE):
        logging.debug("[HANDLER] Matched SENIORITY — using optimize cleaning pipeline")
        steps = [clean_headers]
        df = clean_xlsx(file, *steps, name=fname)
        return handle_seniority(df)

    elif re.search(CATALOG_REGEX, fname_lower, re.IGNORECASE):
        logging.debug("[HANDLER] Matched CATALOG")
        df = pd.read_excel(file)
        return handle_inventory(df)

    elif re.search(ZWDISEG_REGEX, fname_lower, re.IGNORECASE):
        logging.debug("[HANDLER] Matched ZWDISEG — using zwdiseg cleaning pipeline")
        steps = [clean_headers, clean_columns, clean_deleted_rows, clean_flags, clean_format]
        df = clean_xlsx(file, *steps, name=fname)
        return handle_zwdiseg(df)

    else:
        logging.debug("[HANDLER] No match — using fallback cleaning pipeline")
        steps = [clean_headers, clean_columns, clean_flags, clean_deleted_rows, clean_format]
        df = clean_xlsx(file, *steps, name=fname, multi_sheet=False)
        return handle_cleaner(df)

# ==============================
# MAIN ENTRYPOINT
# ROUTE BASED ON FILE TYPE/NAME
# ==============================
def process_index_upload():
    try:
        uploaded_files = request.files.getlist("uploads")
        existing_files = request.form.getlist("existing_files")

        # ==============================
        # HANDLE MISSING FILES
        # ==============================
        if not uploaded_files and not existing_files:
            return render_template("index.html", error="[HANDLER] No files uploaded.")

        # ==============================
        # HANDLE EXISTING FILE SELECTION (STATIC)
        # ==============================
        if existing_files:
            fname = secure_filename(existing_files[0])
            fname_lower = fname.lower()
            logging.debug(f"[HANDLER] Selected existing file: {fname}")

            # ==============================
            # SQLite: Inventory Database
            # ==============================
            if fname_lower.endswith(".db"):
                static_path = os.path.join("static", fname)
                logging.debug(f"[HANDLER] Using static DB path: {static_path}")

                with sqlite3.connect(static_path) as conn:
                    df = pd.read_sql_query("SELECT * FROM inventory", conn)

                df = clean_db(df, name="DB Inventory Load")
                return handle_inventory(df)

            # ==============================
            # Excel: Clean and reroute based on cleaned content
            # ==============================
            elif fname_lower.endswith(".xlsx"):
                static_path = os.path.join("static", fname)
                logging.debug("[HANDLER] Routed to cleaner logic for static .xlsx file")
                with open(static_path, "rb") as f:
                    return handle_excel_file(f, fname)

            # ==============================
            # UNSUPPORTED STATIC FILE TYPE
            # ==============================
            return render_template("index.html", error="[HANDLER] Unsupported file type.")

        # ==============================
        # FILE UPLOAD FLOW
        # ==============================
        file = uploaded_files[0]
        fname = secure_filename(file.filename)
        fname_lower = fname.lower()

        logging.debug(f"[HANDLER] Uploaded file: {fname}")

        # ==============================
        # PDF: FLOWSHEET / ARG
        # ==============================
        if fname_lower.endswith(".pdf"):
            from report import process_report
            match = re.search(r"\d{4}-\d{2}-\d{2}", fname)
            date_str = match.group() if match else "unknown"
            pdf_name = f"ARG_{date_str}.pdf"

            save_path = os.path.join("/tmp", pdf_name)
            file.save(save_path)
            logging.debug(f"[HANDLER] Saved uploaded PDF as: {save_path}")

            output_files, stats = process_report([save_path])
            output_filenames = [os.path.basename(f) for f in output_files]
            if pdf_name not in output_filenames:
                output_filenames.append(pdf_name)

            return render_template("arg.html", outputs=output_filenames, stats=stats)

        # ==============================
        # Excel: Clean and reroute based on cleaned content
        # ==============================
        if fname_lower.endswith(".xlsx"):
            logging.debug("[HANDLER] Routed to cleaner logic for uploaded .xlsx file")
            return handle_excel_file(file, fname)

        # ==============================
        # SQLite: Inventory Database (Uploaded)
        # ==============================
        if fname_lower.endswith(".db"):
            logging.debug("[HANDLER] Matched SQLite DB — reading inventory table")
            save_path = os.path.join("/tmp", fname)
            file.save(save_path)

            with sqlite3.connect(save_path) as conn:
                df = pd.read_sql_query("SELECT * FROM inventory", conn)

            df = clean_db(df, name="DB Inventory Load")
            return handle_inventory(df)

        # ==============================
        # UNKNOWN FILE TYPE
        # ==============================
        return render_template("index.html", error="[HANDLER] Unsupported file type.")

    except Exception as e:
        logging.exception("[HANDLER] Error during file processing")
        return render_template("index.html", error=f"[HANDLER] Unexpected error during routing: {str(e)}")
