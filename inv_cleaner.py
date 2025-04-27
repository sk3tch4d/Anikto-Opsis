# ==============================
# INV_CLEANER.PY - CLEAN XLSX
# ==============================

import pandas as pd
import json
import os
import tempfile
from datetime import datetime

# ==============================
# DEFAULT CONFIG PATH
# ==============================
DEFAULT_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "inv_xlsx_filters.json")

# ==============================
# Load Config Utility
# ==============================
def load_config(config_path=DEFAULT_CONFIG_PATH):
    try:
        with open(config_path, "r") as f:
            config = json.load(f)
        return config.get("column_renames", {}), config.get("remove_columns", [])
    except FileNotFoundError:
        return {}, []

# ==============================
# Autofit Columns Utility
# ==============================
def autofit_columns(worksheet, max_width=40, min_width=10, padding=2):
    for col_cells in worksheet.columns:
        lengths = [len(str(cell.value)) if cell.value is not None else 0 for cell in col_cells]
        if lengths:
            best_fit = max(lengths) + padding
            best_fit = min(max(best_fit, min_width), max_width)
            col_letter = col_cells[0].column_letter
            worksheet.column_dimensions[col_letter].width = best_fit

# ==============================
# CLEAN XLSX
# ==============================
def clean_xlsx(file_stream, config_path=None):
    column_renames, remove_columns = load_config(config_path or DEFAULT_CONFIG_PATH)

    df = pd.read_excel(file_stream)

    # Normalize columns
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)

    # 1. Rename
    if column_renames:
        df.rename(columns={k: v for k, v in column_renames.items() if k in df.columns}, inplace=True)

    # 2. Drop rows: Description starts with XX or XXX (case insensitive)
    if 'Description' in df.columns:
        df = df[~df['Description'].astype(str).str.match(r'^(XX|XXX)', case=False, na=False)]

    # 3. Drop rows: any 'DELETED' anywhere
    mask_deleted = df.astype(str).apply(lambda x: x.str.contains('DELETED', case=False, na=False)).any(axis=1)
    df = df[~mask_deleted]

    # 4. Drop rows where 'Mat', 'Pl', or 'Del' == 'X'
    cols_to_check = []
    for original_col in ['Mat', 'Pl', 'Del']:
        new_col = column_renames.get(original_col, original_col)
        if new_col in df.columns:
            cols_to_check.append(new_col)

    for col in cols_to_check:
        df = df[df[col].astype(str).str.upper() != 'X']

    # 5. Drop duplicate columns
    if df.columns.duplicated().any():
        df = df.loc[:, ~df.columns.duplicated()]

    # 6. Remove unwanted columns
    if remove_columns:
        df.drop(columns=[col for col in remove_columns if col in df.columns], inplace=True, errors='ignore')

    return df

# ==============================
# CLEANER SAVE AND RETURN
# ==============================
def clean_xlsx_and_save(file_stream, config_path=None):
    if not file_stream.filename.lower().endswith('.xlsx'):
        raise ValueError("Invalid file format. Please upload an .xlsx file.")

    cleaned_df = clean_xlsx(file_stream, config_path)

    base_filename = os.path.splitext(os.path.basename(file_stream.filename))[0]
    today = datetime.now().strftime("%Y-%m-%d")
    cleaned_filename = f"{base_filename}_cleaned_{today}.xlsx"
    cleaned_path = os.path.join("/tmp", cleaned_filename)

    with pd.ExcelWriter(cleaned_path, engine="openpyxl") as writer:
        cleaned_df.to_excel(writer, index=False)

        workbook = writer.book
        worksheet = writer.sheets["Sheet1"]

        autofit_columns(worksheet)

    return cleaned_path, cleaned_filename
