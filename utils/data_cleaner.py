# ==============================
# DATA_CLEANER.PY — CLEAN XLSX FILES FOR ROUTING
# ==============================

import pandas as pd
import os
import logging
import tempfile
from openpyxl.utils import get_column_letter

# ==============================
# CONFIG — RENAME AND REMOVE MAPS
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
    "Quantity Posted from Dep.Inven": "Consumed",
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
    "BUn.4": "UOM",
    "Net price": "Cost",
    "Matl grp": "Group",
    "Material Group": "Group",
    "Replenishmt qty": "ROQ",
    "Reorder point": "ROP",
    "Old Mat": "Old",
    "Old Material Number": "Old",
    "Created": "Created",
    "Cost ctr": "Cost_Center",
    "Cost Ctr": "Cost_Center",
    "Vendor's Name": "Vendor_Name",
    "Vendors name": "Vendor_Name",
    "years": "Years",
    "Limited Seniority Years": "Years",
    "Vendor material numTer": "Vendor_Material",
    "Vendor material number": "Vendor_Material"
}

REMOVE_COLUMNS = [
    "StL", "Mat", "Pl", "Plnt", "Un.1", "Un.2",
    "Latex/Expiry Information", "Person responsible",
    "Stge loc. descr.", "MRPC", "Type", "Plant", "Del",
    "Last Order Price", "Curr.", "Per", "Last PO", 
    "BUn.1", "BUn.2", "BUn.3", "BUn.5", "BUn.6", 
    "Conv.", "=", "OPUn", "OUn", "Curr..1", "OPUn.1", "D",
    "Departmental Inventory Record", "Item", "Year", "Plnt",
    "Counted qty.1", "Valuated Unrestricted-Use Stoc",
    "Valuated Unrestricted-Use Stoc.1", "BUn", "DSt",
    "Reorder point for storage loca.1", "Mat. Doc.",
    "Replenishment quantity for slo.1", "MatYr",
    "Difference Quantity from Dep.I.1", "Item.1",
    "Quantity Posted from Dep.Inven.1",
    "Reason Text for Departmental I", "Status of count"
]

# ==============================
# LOG CLEANING
# ==============================
def log_cleaning(step, df, extra=""):
    name = df.attrs.get("name", "Unnamed")
    logging.debug(f"[CLEAN] {step} -> {name}{f' — {extra}' if extra else ''}")

# ==============================
# CLEANING FUNCTIONS (STEP MODULES)
# ==============================
def clean_headers(df):
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)
    rename_map = {k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}
    df.rename(columns=rename_map, inplace=True)
    log_cleaning("Headers", df)
    return df

def clean_columns(df):
    df = df.loc[:, ~df.columns.duplicated()]
    df.drop(columns=[col for col in REMOVE_COLUMNS if col in df.columns], inplace=True, errors='ignore')
    log_cleaning("Columns", df, extra=f"{len(df.columns)} columns remain")
    return df

def clean_deleted_rows(df):
    mask = df.astype(str).apply(lambda x: x.str.contains('DELETED', case=False, na=False)).any(axis=1)
    log_cleaning("Deleted Rows", df, extra=f"{mask.sum()} rows removed")
    return df[~mask]

def clean_flags(df):
    for col in ['Mat', 'Pl', 'D', 'Del']:
        if col in df.columns:
            df = df[df[col].astype(str).str.upper() != 'X']
    log_cleaning("Flags", df)
    return df

def clean_format(df):
    if 'Created' in df.columns:
        df['Created'] = pd.to_datetime(df['Created'], errors='coerce').dt.date
    sort_cols = []
    if 'Material' in df.columns: sort_cols.append('Material')
    if 'USL' in df.columns: sort_cols.append('USL')
    if sort_cols:
        df = df.sort_values(by=sort_cols, ascending=True, na_position='last')
    log_cleaning("Formatting", df)
    return df

# ==============================
# DYNAMIC CLEANING PIPELINE
# ==============================
def clean_xlsx(file_stream, *steps, header=0, name=None):
    df = pd.read_excel(file_stream, header=header)
    df.attrs["name"] = name or "Unnamed DataFrame"
    log_cleaning("Cleaning File", df)

    for step in steps:
        df = step(df)

    # Normalize 'Date' after cleaning (Removes 00:00:00 from pandas)
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce').dt.date
        log_cleaning("Normalized Date", df)

    return df

# ==============================
# EXCEL COLUMN AUTO-FIT
# ==============================
def autofit_columns(worksheet, max_width=40, min_width=10, padding=2):
    for col_cells in worksheet.columns:
        lengths = [len(str(cell.value)) if cell.value else 0 for cell in col_cells]
        best_fit = min(max(max(lengths) + padding, min_width), max_width)
        col_letter = get_column_letter(col_cells[0].column)
        worksheet.column_dimensions[col_letter].width = best_fit

# ==============================
# SAVE TO TEMP FILE FOR DOWNLOAD
# ==============================
def save_cleaned_df(df):
    with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx", dir="/tmp") as tmp:
        path = tmp.name
    with pd.ExcelWriter(path, engine="openpyxl") as writer:
        df.to_excel(writer, index=False)
        autofit_columns(writer.sheets["Sheet1"])
    log_cleaning("Saved File", df)
    return path
