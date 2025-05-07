# ==============================
# DATA_CLEANER.PY — CLEAN XLSX FILES
# ==============================

import pandas as pd
import os
from datetime import datetime
from openpyxl.utils import get_column_letter

# ==============================
# COLUMN CONFIGURATION
# ==============================

COLUMN_RENAMES = {
    "time": "Time",
    "name": "Name",
    "Dif": "Changed",
    "MvT": "MVT",
    "Count date": "Date",
    "Reorder point for storage loca": "ROP",
    "Replenishment quantity for slo": "ROQ",
    "Difference Quantity from Dep.I": "Difference",
    "Quantity Posted from Dep.Inven": "New QTY",
    "Counted qty": "Counted",
    "SLoc": "USL",
    "Sloc": "USL",
    "Mat.#": "Num",
    "Mat. #": "Num",
    "Material": "Num",
    "Material Description": "Description",
    "Material description": "Description",
    "Un": "UOM",
    "U/M": "UOM",
    "Net price": "Cost",
    "Matl grp": "Goup",
    "Material Group": "Goup",
    "Replenishmt qty": "ROQ",
    "Reorder point": "ROP",
    "Old Material Number": "Old",
    "Created": "Created",
    "Cost ctr": "Cost Center",
    "Vendor's Name": "Vendor Name",
    "Vendor material numTer": "Vendor Material",
    "Vendor material number": "Vendor Material"
}

REMOVE_COLUMNS = [
    "StL", "Mat", "Pl", "Plnt", "Un.1", "Un.2",
    "Latex/Expiry Information", "Person responsible",
    "Stge loc. descr.", "MRPC", "Type", "Plant", "Del",
    "Last Order Price", "Curr.", "Per", "Last PO",
    "Conv.", "=", "OPUn", "OUn", "Curr..1", "OPUn.1", "D",
    "Departmental Inventory Record", "Item","Year", "Plnt",
    "Counted qty.1", "Valuated Unrestricted-Use Stoc",
    "Valuated Unrestricted-Use Stoc.1", "BUn", "DSt",
    "Reorder point for storage loca.1", "Mat. Doc.",
    "Replenishment quantity for slo.1", "MatYr",
    "Difference Quantity from Dep.I.1", "Item.1",
    "Quantity Posted from Dep.Inven.1",
    "Reason Text for Departmental I", "Status of count"              
]

# ==============================
# UTILITY: AUTOFIT COLUMNS
# ==============================

def autofit_columns(worksheet, max_width=40, min_width=10, padding=2):
    for col_cells in worksheet.columns:
        lengths = [len(str(cell.value)) if cell.value is not None else 0 for cell in col_cells]
        if lengths:
            best_fit = max(lengths) + padding
            best_fit = min(max(best_fit, min_width), max_width)
            col_letter = get_column_letter(col_cells[0].column)
            worksheet.column_dimensions[col_letter].width = best_fit

# ==============================
# MAIN CLEANING FUNCTION
# ==============================

def clean_xlsx(file_stream):
    df = pd.read_excel(file_stream)

    # Normalize column headers
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)

    # Rename known columns
    rename_map = {k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}
    df.rename(columns=rename_map, inplace=True)

    # Drop rows where 'Description' starts with XX/XXX
    if 'Description' in df.columns:
        df = df[~df['Description'].astype(str).str.match(r'^(XX|XXX)', case=False, na=False)]

    # Drop rows containing 'DELETED' in any column
    mask_deleted = df.astype(str).apply(lambda x: x.str.contains('DELETED', case=False, na=False)).any(axis=1)
    df = df[~mask_deleted]

    # Drop rows with 'X' in certain flag columns
    for col in ['Mat', 'Pl', 'D', 'Del']:
        if col in df.columns:
            df = df[df[col].astype(str).str.upper() != 'X']

    # Remove duplicate columns
    if df.columns.duplicated().any():
        df = df.loc[:, ~df.columns.duplicated()]

    # Remove unwanted columns
    df.drop(columns=[col for col in REMOVE_COLUMNS if col in df.columns], inplace=True, errors='ignore')

    # Convert 'Created' column to date only
    if 'Created' in df.columns:
        df['Created'] = pd.to_datetime(df['Created'], errors='coerce').dt.date

    # Sort
    sort_cols = []
    if 'Material' in df.columns:
        sort_cols.append('Material')
    if 'USL' in df.columns:
        sort_cols.append('USL')
    if sort_cols:
        df = df.sort_values(by=sort_cols, ascending=True, na_position='last')

    return df

# ==============================
# CLEAN, SAVE, AND RETURN FILEPATH
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
        worksheet = writer.sheets["Sheet1"]
        autofit_columns(worksheet)

    return cleaned_path, cleaned_filename
