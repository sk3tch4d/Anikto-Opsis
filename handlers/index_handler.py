import os
import re
from config import UPLOAD_FOLDER, MAX_PDFS, INVENTORY_DF
from datetime import datetime
from flask import request, render_template, current_app as app
from inventory import load_inventory_data
from seniority import load_seniority_file
from report import process_report


def process_index_upload():
    uploaded_files = request.files.getlist("uploads")
    existing_files = request.form.getlist("existing_pdfs")

    pdf_files = []
    seniority_df = None
    seniority_filename = None

    for file in uploaded_files:
        ext = os.path.splitext(file.filename)[1].lower()
        fname_lower = file.filename.lower()

        if ext == ".pdf":
            save_path = os.path.join(UPLOAD_FOLDER, file.filename)
            if not os.path.exists(save_path):
                file.save(save_path)
            pdf_files.append(save_path)
            app.logger.info(f"[PDF] Saved: {save_path}")

        elif ext in [".xlsx", ".db"]:
            # ✅ Detect Seniority
            if ext == ".xlsx" and all(k in fname_lower for k in ["cupe", "seniority", "list"]):
                match = re.search(r"(\d{4}-\d{2}-\d{2})", fname_lower)
                date_str = match.group(1) if match else datetime.now().strftime("%Y-%m-%d")
                new_filename = f"CUPE-SL-{date_str}.xlsx"

                save_path = os.path.join("/tmp", new_filename)
                file.save(save_path)
                seniority_df = load_seniority_file(save_path)
                seniority_filename = new_filename
                app.logger.info(f"[SENIORITY] Loaded: {save_path}")

            # ✅ Detect Inventory
            elif ext == ".xlsx" and "inventory" in fname_lower:
                save_path = os.path.join("/tmp", "uploaded_inventory.xlsx")
                file.save(save_path)
                config.INVENTORY_DF = load_inventory_data(path=save_path)
                app.logger.info(f"[INVENTORY] Reloaded from: {save_path}")

            # ✅ Detect Catalog
            elif re.match(r"^cat_v\d+\.(xlsx|db)$", fname_lower):
                save_path = os.path.join("/tmp", file.filename)
                file.save(save_path)
                app.logger.info(f"[CATALOG] Uploaded catalog file: {save_path}")

            else:
                app.logger.warning(f"[SKIPPED] Unknown or unsupported file: {file.filename}")
        else:
            app.logger.warning(f"[SKIPPED] Unrecognized file extension: {file.filename}")

    # ✅ Add existing PDFs from checkbox
    for fname in existing_files:
        if fname.endswith(".pdf"):
            path = os.path.join(UPLOAD_FOLDER, fname)
            if os.path.exists(path):
                pdf_files.append(path)

    # ✅ Routing logic
    if not pdf_files and seniority_df is None:
        if INVENTORY_DF is not None:
            return render_template("inventory.html", table=[])
        return render_template("index.html", error="No valid files selected or uploaded.")

    if seniority_df is not None and not pdf_files:
        return render_template(
            "seniority.html",
            table=seniority_df.to_dict(orient="records"),
            filename=seniority_filename
        )

    output_files, stats = process_report(pdf_files)
    return render_template("arg.html", outputs=[os.path.basename(f) for f in output_files], stats=stats)
