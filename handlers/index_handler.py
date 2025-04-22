# ==============================
# INDEX HANDLER: Upload & Routing
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

# ==============================
# MAIN ENTRYPOINT
# ==============================
def process_index_upload():
    uploaded_files = request.files.getlist("uploads")
    existing_files = request.form.getlist("existing_pdfs")

    pdf_files = []
    seniority_df = None
    has_inventory = False

    # ==============================
    # HANDLERS FOR EACH TYPE
    # ==============================
    def handle_pdf(file, _):
        save_path = os.path.join(UPLOAD_FOLDER, file.filename)
        if not os.path.exists(save_path):
            file.save(save_path)
        pdf_files.append(save_path)
        if DEBUG_MODE:
            app.logger.info(f"[PDF] Saved: {save_path}")

    def handle_seniority(file, fname_lower):
        nonlocal seniority_df
        match = re.search(r"(\d{4}-\d{2}-\d{2})", fname_lower)
        date_str = match.group(1) if match else datetime.now().strftime("%Y-%m-%d")
        save_path = os.path.join("/tmp", f"CUPE-SL-{date_str}.xlsx")
        file.save(save_path)
        seniority_df = load_seniority_file(save_path)
        if DEBUG_MODE:
            app.logger.info(f"[SENIORITY] Loaded: {file.filename}")

    def handle_inventory(file, _):
        nonlocal has_inventory
        save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
        file.save(save_path)
        config.INVENTORY_DF = load_inventory_data(path=save_path)
        has_inventory = True
        if DEBUG_MODE:
            app.logger.info(f"[INVENTORY] Uploaded: {file.filename}")

    # ==============================
    # MATCHERS
    # ==============================
    MATCHERS = [
        {
            "type": "pdf",
            "ext": ".pdf",
            "handler": handle_pdf
        },
        {
            "type": "seniority",
            "regex": SENIORITY_REGEX,
            "ext": ".xlsx",
            "handler": handle_seniority
        },
        {
            "type": "inventory",
            "regex": CATALOG_REGEX,
            "exts": [".xlsx", ".db"],
            "handler": handle_inventory
        }
    ]

    matched_type = None

    # ==============================
    # PROCESS UPLOADED FILES
    # ==============================
    for file in uploaded_files:
        ext = os.path.splitext(file.filename)[1].lower()
        fname_lower = file.filename.lower()

        matched = False
        for matcher in MATCHERS:
            if "ext" in matcher and ext != matcher["ext"]:
                continue
            if "exts" in matcher and ext not in matcher["exts"]:
                continue
            if "regex" in matcher and not re.search(matcher["regex"], fname_lower, re.IGNORECASE):
                continue
            if "match_fn" in matcher and not matcher["match_fn"](fname_lower):
                continue

            # Strict single-type enforcement
            if matched_type and matched_type != matcher["type"]:
                if DEBUG_MODE:
                    app.logger.warning(f"[REJECTED] Multiple file types detected: '{matched_type}' and '{matcher['type']}'")
                return render_template("index.html", error="Please upload only one file type at a time.")

            if DEBUG_MODE:
                app.logger.info(f"[MATCHED] {file.filename} matched type '{matcher['type']}'")
            matcher["handler"](file, fname_lower)
            matched_type = matcher["type"]
            matched = True
            break

        if not matched;
            app.logger.warning(f"[SKIPPED] Unknown or unsupported file: {file.filename}")
    
            if DEBUG_MODE:
                print(f"[DEBUG] No match found for: {file.filename}")


    # ==============================
    # ATTACH EXISTING PDFs
    # ==============================
    for fname in existing_files:
        if fname.endswith(".pdf"):
            path = os.path.join(UPLOAD_FOLDER, fname)
            if os.path.exists(path):
                pdf_files.append(path)
    if pdf_files and not matched_type:
        matched_type = "pdf"

    # ==============================
    # ROUTING (STRICT SINGLE-TYPE LOGIC)
    # ==============================
    if not matched_type:
        if DEBUG_MODE:
            app.logger.info("[ROUTING] No valid files found.")
        return render_template("index.html", error="No valid files selected or uploaded.")

    if matched_type == "seniority":
        if DEBUG_MODE:
            app.logger.info("[ROUTING] Seniority file → Showing seniority view.")
        return render_template(
            "seniority.html",
            table=seniority_df.to_dict(orient="records")
        )

    if matched_type == "inventory":
        if DEBUG_MODE:
            app.logger.info("[ROUTING] Inventory/Catalog file → Showing inventory view.")
        return render_template("inventory.html", table=[])

    if matched_type == "pdf":
        if DEBUG_MODE:
            app.logger.info(f"[ROUTING] PDF file(s) → Processing {len(pdf_files)} file(s).")
        output_files, stats = process_report(pdf_files)
        return render_template(
            "arg.html",
            outputs=[os.path.basename(f) for f in output_files],
            stats=stats
        )
