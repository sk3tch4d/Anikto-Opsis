# ==============================
# INDEX HANDLER: UPLOAD & ROUTE
# ==============================

import os
import re
from datetime import datetime
from flask import request, render_template, current_app as app
import config
from config import UPLOAD_FOLDER, DEBUG_MODE, CATALOG_REGEX, SENIORITY_REGEX
from inventory import load_inventory_data
from seniority import load_seniority_file
from report import process_report
from inv_cleaner import clean_xlsx_and_save

# ==============================
# MAIN ENTRYPOINT
# ==============================
from inv_cleaner import clean_xlsx_and_save
from inv_merger import merge_inventory_final

def process_index_upload():
    uploaded_files = request.files.getlist("uploads")
    existing_files = request.form.getlist("existing_pdfs")

    pdf_files = []
    xlsx_files = []
    other_files = []
    seniority_df = None
    has_inventory = False

    matched_type = None

    # ==============================
    # Classify Uploaded Files
    # ==============================
    for file in uploaded_files:
        ext = os.path.splitext(file.filename)[1].lower()
        fname_lower = file.filename.lower()

        if ext == '.pdf':
            pdf_files.append(file)
        elif ext == '.xlsx':
            xlsx_files.append(file)
        else:
            other_files.append(file)

    # ==============================
    # Handle PDFs Normally
    # ==============================
    if pdf_files and not xlsx_files:
        save_paths = []
        for file in pdf_files:
            save_path = os.path.join(UPLOAD_FOLDER, file.filename)
            if not os.path.exists(save_path):
                file.save(save_path)
            save_paths.append(save_path)

        output_files, stats = process_report(save_paths)
        return render_template(
            "arg.html",
            outputs=[os.path.basename(f) for f in output_files],
            stats=stats
        )

# ==============================
# MAIN ENTRYPOINT
# ==============================
from inv_cleaner import clean_xlsx_and_save
from inv_merger import merge_inventory_final
from inventory import load_inventory_data

def process_index_upload():
    uploaded_files = request.files.getlist("uploads")
    existing_files = request.form.getlist("existing_pdfs")

    pdf_files = []
    xlsx_files = []
    other_files = []
    seniority_df = None
    has_inventory = False

    matched_type = None

    # ==============================
    # Classify Uploaded Files
    # ==============================
    for file in uploaded_files:
        ext = os.path.splitext(file.filename)[1].lower()
        fname_lower = file.filename.lower()

        if ext == '.pdf':
            pdf_files.append(file)
        elif ext == '.xlsx':
            xlsx_files.append(file)
        else:
            other_files.append(file)

    # ==============================
    # Handle PDFs Normally
    # ==============================
    if pdf_files and not xlsx_files:
        save_paths = []
        for file in pdf_files:
            save_path = os.path.join(config.UPLOAD_FOLDER, file.filename)
            if not os.path.exists(save_path):
                file.save(save_path)
            save_paths.append(save_path)

        output_files, stats = process_report(save_paths)
        return render_template(
            "arg.html",
            outputs=[os.path.basename(f) for f in output_files],
            stats=stats
        )

    # ==============================
    # Handle XLSX Files
    # ==============================
    if len(xlsx_files) == 1:
        # One file: Check if it's catalog/inventory or just a normal list
        fname_lower = xlsx_files[0].filename.lower()

        if any(keyword in fname_lower for keyword in ["cat", "inv", "catalog", "inventory"]):
            # Treat as inventory upload
            save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
            xlsx_files[0].save(save_path)
            config.INVENTORY_DF = load_inventory_data(path=save_path)
            return render_template("inventory.html", table=[])

        else:
            # Otherwise, treat as uncleaned list -> Clean it
            cleaned_path, cleaned_filename = clean_xlsx_and_save(xlsx_files[0])
            download_link = f"/download/{cleaned_filename}"
            return render_template(
                "index.html",
                message="File cleaned successfully!",
                download_link=download_link
            )

    elif len(xlsx_files) >= 2:
        # Multiple XLSX uploaded → Merge
        main_file = None
        main_candidates = []
        fallback_sizes = {}

        for file in xlsx_files:
            fname_lower = file.filename.lower()
            file.seek(0, os.SEEK_END)
            size = file.tell()
            file.seek(0)  # reset file pointer after size read

            fallback_sizes[file] = size

            if any(keyword in fname_lower for keyword in ["cat", "inv", "catalog", "inventory"]):
                main_candidates.append(file)

        if main_candidates:
            main_file = main_candidates[0]
        else:
            main_file = max(fallback_sizes, key=fallback_sizes.get)

        # Separate update files
        update_files = [f for f in xlsx_files if f != main_file]

        # Save temp files
        main_temp_path = os.path.join("/tmp", "main_uploaded.xlsx")
        main_file.save(main_temp_path)

        update_temp_paths = []
        for i, f in enumerate(update_files):
            path = os.path.join("/tmp", f"update_uploaded_{i}.xlsx")
            f.save(path)
            update_temp_paths.append(path)

        # Perform merge
        merged_path, merged_filename, log_path, log_filename, _ = merge_inventory_final(
            main_temp_path,
            update_temp_paths
        )

        merged_download_link = f"/download/{os.path.basename(merged_path)}"
        log_download_link = f"/download/{os.path.basename(log_path)}"

        return render_template(
            "index.html",
            message="Files merged successfully!",
            download_link=merged_download_link,
            log_download_link=log_download_link
        )

    # ==============================
    # No Valid Files Uploaded
    # ==============================
    return render_template("index.html", error="No valid files selected or uploaded.")
