# ==============================
# INV_CLEANER.PY - CLEAN XLSX
# ==============================

import pandas as pd
import os
import tempfile
from datetime import datetime

# ==============================
# COLUMN CONFIG
# ==============================

COLUMN_RENAMES = {
    "SLoc": "USL",
    "Sloc": "USL",
    "Mat. #": "Material",
    "Material": "Material",
    "Material Description": "Description",
    "Material description": "Description",
    "Un": "UOM",
    "U/M": "UOM",
    "Matl grp": "Goup",
    "Material Group": "Goup",
    "Replenishmt qty": "ROQ",
    "Reorder point": "ROP",
    "Old Material Number": "Old Material",
    "Created": "Created",
    "Cost ctr": "Cost Center",
    "Vendor's Name": "Vendor Name",
    "Vendor material numTer": "Vendor Material"
}

REMOVE_COLUMNS = [
    "StL", "Mat", "Pl", "Plnt", "Un.1", "Un.2",
    "Latex/Expiry Information", "Person responsible",
    "Stge loc. descr.", "MRPC", "Type", "Plant", "Del"
]

# ==============================
# Utility: Autofit Columns
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
def clean_xlsx(file_stream):
    df = pd.read_excel(file_stream)

    # Normalize columns early
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)

    # 1. Rename columns
    df.rename(columns={k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}, inplace=True)

    # 2. Drop rows: Description starts with XX or XXX
    if 'Description' in df.columns:
        df = df[~df['Description'].astype(str).str.match(r'^(XX|XXX)', case=False, na=False)]

    # 3. Drop rows: any 'DELETED' anywhere
    mask_deleted = df.astype(str).apply(lambda x: x.str.contains('DELETED', case=False, na=False)).any(axis=1)
    df = df[~mask_deleted]

    # 4. Drop rows where 'Mat', 'Pl', or 'Del' == 'X'
    for col in ['Mat', 'Pl', 'Del']:
        if col in df.columns:
            df = df[df[col].astype(str).str.upper() != 'X']

    # 5. Drop duplicate columns
    if df.columns.duplicated().any():
        df = df.loc[:, ~df.columns.duplicated()]

    # 6. Remove unwanted columns
    df.drop(columns=[col for col in REMOVE_COLUMNS if col in df.columns], inplace=True, errors='ignore')

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

    with pd.ExcelWriter(cleaned_path, engine="openpyxl") as writer:
        cleaned_df.to_excel(writer, index=False)

        workbook = writer.book
        worksheet = writer.sheets["Sheet1"]

        autofit_columns(worksheet)

    return cleaned_path, cleaned_filename


# ==============================
# MINI BATCH CLEAN + MERGE
# ==============================

def clean_multiple_and_merge(file_streams):
    """
    Cleans multiple XLSX uploads and merges them into one DataFrame.
    Adds a 'Source File' column with original filename (no extension).
    Saves one merged XLSX.
    """
    cleaned_dfs = []

    for file_stream in file_streams:
        try:
            df = clean_xlsx(file_stream)  # Just clean, don't save
            source_name = os.path.splitext(os.path.basename(file_stream.filename))[0]
            df['Source File'] = source_name
            cleaned_dfs.append(df)
        except Exception as e:
            print(f"[ERROR] Failed to clean {file_stream.filename}: {e}")
            continue

    if not cleaned_dfs:
        raise ValueError("No valid files were cleaned.")

    merged_df = pd.concat(cleaned_dfs, ignore_index=True)

    today = datetime.now().strftime("%Y-%m-%d")
    merged_filename = f"merged_cleaned_inventory_{today}.xlsx"
    merged_path = os.path.join("/tmp", merged_filename)

    with pd.ExcelWriter(merged_path, engine="openpyxl") as writer:
        merged_df.to_excel(writer, index=False)
        workbook = writer.book
        worksheet = writer.sheets["Sheet1"]
        autofit_columns(worksheet)

    return merged_path, merged_filename

