# ==============================
# INV_CLEANER.PY - CLEAN XLSX
# ==============================

import pandas as pd
import json
import os
import tempfile
from datetime import datetime

# ==============================
# Load External JSON Config
# ==============================

# Automatically find the path of inv_xlsx_filters.json
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "inv_xlsx_filters.json")

with open(CONFIG_PATH, "r") as f:
    config = json.load(f)

COLUMN_RENAMES = config.get("column_renames", {})
REMOVE_COLUMNS = config.get("remove_columns", [])

# ==============================
# CLEAN XLSX
# ==============================
def clean_xlsx(file_stream):
    df = pd.read_excel(file_stream)

    # 1. Rename columns immediately
    df.rename(columns={k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}, inplace=True)

    # 2. Drop rows: Description starts with XX or XXX (case insensitive)
    if 'Description' in df.columns:
        df = df[~df['Description'].astype(str).str.match(r'^(XX|XXX)', case=False, na=False)]

    # 3. Drop rows: any 'DELETED' anywhere
    mask_deleted = df.astype(str).apply(lambda x: x.str.contains('DELETED', case=False, na=False)).any(axis=1)
    df = df[~mask_deleted]

    # 4. Drop rows: 'Mat', 'Pl', or 'Del' == 'X'
    for col in ['Mat', 'Pl', 'Del']:
        if col in df.columns:
            df = df[df[col].astype(str).str.upper() != 'X']

    # 5. Drop duplicate columns if any
    if df.columns.duplicated().any():
        df = df.loc[:, ~df.columns.duplicated()]

    # 6. Remove unwanted columns
    cols_to_drop = [col for col in REMOVE_COLUMNS if col in df.columns]
    if cols_to_drop:
        df.drop(columns=cols_to_drop, inplace=True)

    return df

# ==============================
# CLEANER SAVE AND RETURN
# ==============================
def clean_xlsx_and_save(file_stream):
    if not file_stream.filename.lower().endswith('.xlsx'):
        raise ValueError("Invalid file format. Please upload an .xlsx file.")

    cleaned_df = clean_xlsx(file_stream)

    base_filename = os.path.splitext(os.path.basename(file_stream.filename))[0]
    today = datetime.now().strftime("%Y-%m-%d")
    cleaned_filename = f"{base_filename}_cleaned_{today}.xlsx"
    cleaned_path = os.path.join("/tmp", cleaned_filename)

    # Save with openpyxl and auto-adjust columns
    with pd.ExcelWriter(cleaned_path, engine="openpyxl") as writer:
        cleaned_df.to_excel(writer, index=False)

        workbook = writer.book
        worksheet = writer.sheets["Sheet1"]

        max_width = 40
        min_width = 10
        padding = 2

        for col_cells in worksheet.columns:
            lengths = [len(str(cell.value)) if cell.value is not None else 0 for cell in col_cells]
            if lengths:
                best_fit = max(lengths) + padding
                best_fit = min(max(best_fit, min_width), max_width)
                col_letter = col_cells[0].column_letter
                worksheet.column_dimensions[col_letter].width = best_fit

    return cleaned_path, cleaned_filename
