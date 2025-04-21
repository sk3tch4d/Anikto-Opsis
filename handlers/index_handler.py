# ==============================
# INDEX HANDLER: Upload & Routing Logic (Declarative Matcher System)
# ==============================

import os
import re
from datetime import datetime
from flask import request, render_template, current_app as app
import config
from config import (
    UPLOAD_FOLDER,
    MAX_PDFS,
    DEBUG_MODE,
    CATALOG_REGEX,
    SENIORITY_REGEX
)
from inventory import load_inventory_data
from seniority import load_seniority_file
from report import process_report


# ==============================
# MAIN ENTRYPOINT: Index Upload Handler
# ==============================
def process_index_upload():
    uploaded_files = request.files.getlist("uploads")
    existing_files = request.form.getlist("existing_pdfs")

    pdf_files = []
    seniority_df = None
    seniority_filename = None
    has_inventory = False

    # ==============================
    # MATCHER HANDLERS
    # ==============================
    def handle_seniority(file, fname_lower):
        nonlocal seniority_df, seniority_filename
        match = re.search(r"(\d{4}-\d{2}-\d{2})", fname_lower)
        date_str = match.group(1) if match else datetime.now().strftime("%Y-%m-%d")
        new_filename = f"CUPE-SL-{date_str}.xlsx"
        save_path = os.path.join("/tmp", new_filename)
        file.save(save_path)
        seniority_df = load_seniority_file(save_path)
        seniority_filename = new_filename
        if DEBUG_MODE:
            app.logger.info(f"[SENIORITY] Loaded: {save_path}")

    def handle_inventory(file, fname_lower):
        nonlocal has_inventory
        save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
        file.save(save_path)
        config.INVENTORY_DF = load_inventory_data(path=save_path)
        has_inventory = True
        if DEBUG_MODE:
            app.logger.info(f"[INVENTORY] Reloaded from: {save_path}")

    def handle_catalog(file, fname_lower):
        save_path = os.path.join("/tmp", file.filename)
        file.save(save_path)
        if DEBUG_MODE:
            app.logger.info(f"[CATALOG] Uploaded: {save_path}")

    # ==============================
    # FILE TYPE MATCHERS
    # ==============================
    MATCHERS = [
        {
            "type": "seniority",
            "regex": SENIORITY_REGEX,
            "ext": ".xlsx",
            "handler": handle_seniority
        },
        {
            "type": "inventory",
            "match_fn": lambda fname: "inventory" in fname,
            "ext": ".xlsx",
            "handler": handle_inventory
        },
        {
            "type": "catalog",
            "regex": CATALOG_REGEX,
            "exts": [".xlsx", ".db"],
            "handler": handle_catalog
        }
    ]

    # ==============================
    # PROCESS UPLOADED FILES
    # ==============================
    for file in uploaded_files:
        ext = os.path.splitext(file.filename)[1].lower()
        fname_lower = file.filename.lower()

        # === Handle PDFs Directly
        if ext == ".pdf":
            save_path = os.path.join(UPLOAD_FOLDER, file.filename)
            if not os.path.exists(save_path):
                file.save(save_path)
            pdf_files.append(save_path)
            if DEBUG_MODE:
                app.logger.info(f"[PDF] Saved: {save_path}")
            continue

        # === Match Against Defined Handlers
        matched = False
        for matcher in MATCHERS:
            if "ext" in matcher and ext != matcher["ext"]:
                continue
            if "exts" in matcher and ext not in matcher["exts"]:
                continue
            if "regex" in matcher and not re.search(matcher["regex"], fname_lower):
                continue
            if "match_fn" in matcher and not matcher["match_fn"](fname_lower):
                continue
            matcher["handler"](file, fname_lower)
            matched = True
            break

        if not matched and DEBUG_MODE:
            app.logger.warning(f"[SKIPPED] Unknown or unsupported file: {file.filename}")

    # ==============================
    # APPEND EXISTING CHECKED PDFs
    # ==============================
    for fname in existing_files:
        if fname.endswith(".pdf"):
            path = os.path.join(UPLOAD_FOLDER, fname)
            if os.path.exists(path):
                pdf_files.append(path)

    # ==============================
    # ROUTING DECISIONS
    # ==============================
    has_pdfs = bool(pdf_files)
    has_seniority = seniority_df is not None

    if not has_pdfs and not has_seniority and not has_inventory:
        if DEBUG_MODE:
            app.logger.info("[ROUTING] No valid files found. Returning index with error.")
        return render_template("index.html", error="No valid files selected or uploaded.")

    if has_inventory and not has_pdfs and not has_seniority:
        if DEBUG_MODE:
            app.logger.info("[ROUTING] Inventory file detected. Showing inventory panel.")
        return render_template("inventory.html", table=[])

    if has_seniority and not has_pdfs:
        if DEBUG_MODE:
            app.logger.info(f"[ROUTING] Seniority file loaded: {seniority_filename}")
        return render_template(
            "seniority.html",
            table=seniority_df.to_dict(orient="records"),
            filename=seniority_filename
        )

    if has_pdfs and not has_seniority:
        if DEBUG_MODE:
            app.logger.info(f"[ROUTING] Processing {len(pdf_files)} PDF(s).")
        output_files, stats = process_report(pdf_files)
        return render_template(
            "arg.html",
            outputs=[os.path.basename(f) for f in output_files],
            stats=stats
        )

    if DEBUG_MODE:
        app.logger.info("[ROUTING] PDFs and seniority detected. Prioritizing seniority view.")
    return render_template(
        "seniority.html",
        table=seniority_df.to_dict(orient="records"),
        filename=seniority_filename
    )
