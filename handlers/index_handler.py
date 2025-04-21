# ==============================
# INDEX HANDLER: Upload & Routing Logic
# ==============================

import os
import re
import config
from config import UPLOAD_FOLDER, MAX_PDFS
from datetime import datetime
from flask import request, render_template, current_app as app
from inventory import load_inventory_data
from seniority import load_seniority_file
from report import process_report

# ==============================
# DEBUG TOGGLE
# ==============================
DEBUG_MODE = True

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
    # FILE DETECTION + SAVING
    # ==============================
    for file in uploaded_files:
        ext = os.path.splitext(file.filename)[1].lower()
        fname_lower = file.filename.lower()

        # ✅ Handle PDFs
        if ext == ".pdf":
            save_path = os.path.join(UPLOAD_FOLDER, file.filename)
            if not os.path.exists(save_path):
                file.save(save_path)
            pdf_files.append(save_path)
            if DEBUG_MODE:
                app.logger.info(f"[PDF] Saved: {save_path}")

        # ✅ Handle Excel / DB Uploads
        elif ext in [".xlsx", ".db"]:

            # === Detect Seniority Uploads
            if ext == ".xlsx" and all(k in fname_lower for k in ["cupe", "seniority", "list"]):
                match = re.search(r"(\d{4}-\d{2}-\d{2})", fname_lower)
                date_str = match.group(1) if match else datetime.now().strftime("%Y-%m-%d")
                new_filename = f"CUPE-SL-{date_str}.xlsx"

                save_path = os.path.join("/tmp", new_filename)
                file.save(save_path)
                seniority_df = load_seniority_file(save_path)
                seniority_filename = new_filename
                if DEBUG_MODE:
                    app.logger.info(f"[SENIORITY] Loaded: {save_path}")

            # === Detect Inventory Uploads
            elif ext == ".xlsx" and "inventory" in fname_lower:
                save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
                file.save(save_path)
                config.INVENTORY_DF = load_inventory_data(path=save_path)
                has_inventory = True
                if DEBUG_MODE:
                    app.logger.info(f"[INVENTORY] Reloaded from: {save_path}")

            # === Detect Catalog Uploads
            elif re.match(r"^(catalog|inventory|cat[_-]?v[\d.]+)\.(xlsx|db)$", fname_lower, re.IGNORECASE):
                save_path = os.path.join("/tmp", file.filename)
                file.save(save_path)
                if DEBUG_MODE:
                    app.logger.info(f"[CATALOG] Uploaded: {save_path}")

            # === Unknown Upload Type
            else:
                if DEBUG_MODE:
                    app.logger.warning(f"[SKIPPED] Unknown or unsupported file: {file.filename}")

        # ✅ Unrecognized File Type
        else:
            if DEBUG_MODE:
                app.logger.warning(f"[SKIPPED] Unrecognized file extension: {file.filename}")

    # ==============================
    # ADD EXISTING CHECKED PDFs
    # ==============================
    for fname in existing_files:
        if fname.endswith(".pdf"):
            path = os.path.join(UPLOAD_FOLDER, fname)
            if os.path.exists(path):
                pdf_files.append(path)

    # ==============================
    # ROUTING LOGIC (View Dispatch)
    # ==============================
    has_pdfs = bool(pdf_files)
    has_seniority = seniority_df is not None

    # === No Valid Uploads
    if not has_pdfs and not has_seniority and not has_inventory:
        if DEBUG_MODE:
            app.logger.info("[ROUTING] No valid files found. Returning index with error.")
        return render_template("index.html", error="No valid files selected or uploaded.")

    # === Inventory Only
    if has_inventory and not has_pdfs and not has_seniority:
        if DEBUG_MODE:
            app.logger.info("[ROUTING] Inventory file detected. Showing inventory panel.")
        return render_template("inventory.html", table=[])

    # === Seniority Only
    if has_seniority and not has_pdfs:
        if DEBUG_MODE:
            app.logger.info(f"[ROUTING] Seniority file loaded: {seniority_filename}")
        return render_template(
            "seniority.html",
            table=seniority_df.to_dict(orient="records"),
            filename=seniority_filename
        )

    # === PDFs Only
    if has_pdfs and not has_seniority:
        if DEBUG_MODE:
            app.logger.info(f"[ROUTING] Processing {len(pdf_files)} PDF(s).")
        output_files, stats = process_report(pdf_files)
        return render_template(
            "arg.html",
            outputs=[os.path.basename(f) for f in output_files],
            stats=stats
        )

    # === Mixed: PDFs + Seniority
    if DEBUG_MODE:
        app.logger.info(f"[ROUTING] PDFs and seniority detected. Prioritizing seniority view.")
    return render_template(
        "seniority.html",
        table=seniority_df.to_dict(orient="records"),
        filename=seniority_filename
    )
