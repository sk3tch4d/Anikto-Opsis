# ==============================
# DATA_CLEANER.PY — CLEAN XLSX FILES FOR ROUTING
# ==============================

import pandas as pd
import numpy as np
import os
import logging
import tempfile

from openpyxl.utils import get_column_letter
from openpyxl.styles import Border, Side
from data_format import format_fillrate, format_cart_ops

# ==============================
# CONFIG — RENAME AND REMOVE MAPS
# ==============================
COLUMN_RENAMES = {
    "time": "Time",
    "name": "Name",
    "Dif": "Changed",
    "MvT": "MVT",
    "Total of Movements": "MVT",
    "New Bin": "New",
    "Count date": "Date",
    "DATE": "Date",
    "Reorder point for storage loca": "ROP",
    "Replenishment quantity for slo": "ROQ",
    "Recommended ROP": "RROP",
    "Recommended ROQ": "RROQ",
    "Site Suggested ROP": "SROP",
    "Site Suggested ROQ": "SROQ",
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
    "DESCRIPTION": "Description",
    "Un": "UOM",
    "U/M": "UOM",
    "BUn.4": "UOM",
    "BUn of measure": "UOM",
    "Net price": "Cost",
    "Matl grp": "Group",
    "Material Group": "Group",
    "Replenishmt qty": "ROQ",
    "Reorder point": "ROP",
    "QTY on Hand": "QTY",
    "Old Mat": "Old",
    "Old Material Number": "Old",
    "Created": "Created",
    "Date of First Movement": "First",
    "Cost ctr": "Cost_Center",
    "Cost Ctr": "Cost_Center",
    "Cart Usage 1": "CU1",
    "Cart Usage 2": "CU2",
    "Cost Centre Usage 1": "CC1",
    "Cost Centre Usage 2": "CC2",
    "Vendor's Name": "Vendor_Name",
    "Vendors name": "Vendor_Name",
    "years": "Years",
    "Employee Subgroup": "Status",
    "Limited Sen. Yrs": "Years",
    "Limited Seniority Years": "Years",
    "Vendor material numTer": "Vendor_Material",
    "Vendor material number": "Vendor_Material",
    "SKU": "Preferred",
    "eta preferred": "Preferred ETA",
    "soh": "On-Hand",
    "sub eta": "Sub ETA",
    "sub stock": "Sub Stock"
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
    "Conversion Numerator", "Conversion Numberator",
    "Alt. unit of Measure", "Quantity Posted from Dep.Inven.1", 
    "Total QOH Value", "Alt. Unit of Measure", "Alt. Unit of Measure",
    "MPQ", "Man. Rev. Req.", "Man. Rev. Req. Site", "MRRS",
    "Recommended Max Stock Val.", "Cur. Max Stock Val.", "MA Price",
    "Reason Text for Departmental I", "Status of count", "MRP Controller",
    "SCI Comment", "MMC Comment", "HOSPITAL COMMENT", "Line Fill Status",
    "PO number", "Order", "Ship", "Sold", "Code", "Del", "nan"
]

# ==============================
# LOG CLEANING
# ==============================
def log_cleaning(step, df, extra=""):
    name = df.attrs.get("name", "Unnamed")
    logging.debug(f"[CLEAN]🧹 {step} -> {name}{f' — {extra}' if extra else ''}")

# ==============================
# DETECT AND SET HEADER
# ==============================
def detect_and_set_header(df, max_rows=20):
    for i in range(max_rows):
        row = df.iloc[i]
        num_strings = sum(isinstance(val, str) and val.strip() != "" for val in row)
        unique_values = len(set(val for val in row if isinstance(val, str) and val.strip() != ""))
        if num_strings >= len(row) // 2 and unique_values >= 3: # Heuristic: majority are valid strings
            df.columns = row
            df = df.iloc[i + 1:].reset_index(drop=True)
            
            logging.debug(f"[CLEAN]🧹 Detected header at row {i} with {num_strings} strings and {unique_values} unique values")
            return df

    logging.debug("[CLEAN]🧹 No valid header row detected in preview window.")
    return df  # Fallback: return unchanged

# ==============================
# DETECT UNION VALUE
# ==============================
def detect_union_value(df):
    if any(str(col).strip().upper() == "UNION" for col in df.iloc[0]):
        log_cleaning("Union Column Present — Skipping Detection", df)
        return None

    preview = df.head(5).fillna("").astype(str).apply(lambda x: x.str.upper())
    text = " ".join(preview.values.flatten())
    logging.debug(f"[DEBUG] Preview flattened text: {text!r}")

    if "OPSEU" in text:
        log_cleaning("Union Found:", df, extra="OPSEU")
        return "OPSEU"
    elif "CUPE" in text:
        log_cleaning("Union Found:", df, extra="CUPE")
        return "CUPE"

    log_cleaning("No Union Found:", df)
    return None

# ==============================
# CLEANING FUNCTIONS (STEP MODULES)
# ==============================
def clean_headers(df):
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)
    rename_map = {k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}
    df.rename(columns=rename_map, inplace=True)
    log_cleaning("Headers", df)
    return df
# ==============================
def clean_columns(df):
    df = df.loc[:, ~df.columns.duplicated()]
    df.drop(columns=[col for col in REMOVE_COLUMNS if col in df.columns], inplace=True, errors='ignore')
    log_cleaning("Columns", df, extra=f"{len(df.columns)} columns remain")
    return df
# ==============================
def clean_deleted_rows(df):
    mask = df.astype(str).apply(lambda x: x.str.contains('DELETED', case=False, na=False)).any(axis=1)
    log_cleaning("Deleted Rows", df, extra=f"{mask.sum()} rows removed")
    return df[~mask]
# ==============================
def clean_flags(df):
    for col in ['Mat', 'Pl', 'D', 'Del']:
        if col in df.columns:
            df = df[df[col].astype(str).str.upper() != 'X']
    log_cleaning("Flags", df)
    return df
# ==============================
def clean_format(df):
    sort_cols = []
    if 'Material' in df.columns: sort_cols.append('Material')
    if 'Bin' in df.columns: sort_cols.append('Bin')
    #if 'USL' in df.columns: sort_cols.append('USL')
    for col in sort_cols:
        df[col] = df[col].astype(str)  # Convert to string 
    if sort_cols:
        df = df.sort_values(by=sort_cols, ascending=True, na_position='last')
    log_cleaning("Formatting", df)
    return df

# ==============================
# XLSX CLEANING PIPELINE
# ==============================
def clean_xlsx(file_stream, *steps, header=None, name=None, detect_header=True, multi_sheet=True):
    if multi_sheet:
        sheet_dict = pd.read_excel(file_stream, sheet_name=None, header=None)
        cleaned_dfs = []

        for sheet_name, df in sheet_dict.items():
            df.attrs["name"] = sheet_name

            # Strip column names and drop empty rows
            df.columns = [str(col).strip() for col in df.columns]
            df = df.dropna(how="all")

            # Detect union BEFORE header stripping
            union = detect_union_value(df)

            if detect_header:
                df = detect_and_set_header(df)

            log_cleaning("Cleaning Sheet", df, extra=f"Sheet: {sheet_name}")

            # Apply all cleaning steps
            for step in steps:
                df = step(df)

            # Normalize dates
            for col in ['Created', 'Date', 'First']:
                if col in df.columns:
                    df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                    log_cleaning("Normalized Date", df)

            # Attach union value AFTER cleaning
            if union:
                df["Union"] = [union] * len(df)
                log_cleaning("Detected Union", df, extra=union)

            cleaned_dfs.append(df)

        if not cleaned_dfs:
            return pd.DataFrame()

        df_combined = pd.concat(cleaned_dfs, ignore_index=True)
        df_combined = adjust_cart_ops(df_combined)
        df_combined.attrs["name"] = name or "Combined Sheets"
        return df_combined

    else:
        # Load only the first sheet
        xls = pd.ExcelFile(file_stream)
        sheet_name = xls.sheet_names[0]
        df = pd.read_excel(file_stream, header=None, sheet_name=sheet_name)
        df.attrs["name"] = name or sheet_name

        # Detect union BEFORE header stripping
        union = detect_union_value(df)

        if detect_header:
            df = detect_and_set_header(df)

        df.columns = [str(col).strip() for col in df.columns]
        df = df.dropna(how="all")

        log_cleaning("Cleaning Sheet", df, extra=f"Sheet: {sheet_name}")

        for step in steps:
            df = step(df)

        for col in ['Created', 'Date', 'First']:
            if col in df.columns:
                df[col] = pd.to_datetime(df[col], errors='coerce').dt.date
                log_cleaning("Normalized Date", df)

        # Attach union value AFTER cleaning
        if union:
            df["Union"] = [union] * len(df)
            log_cleaning("Detected Union", df, extra=union)

        df = format_cart_ops(df)
        df = format_fillrate(df)
        return df

# ==============================
# DB CLEANING PIPELINE
# ==============================
def clean_db(df, name="DB Inventory"):
    #df = detect_and_set_header(df) # Adjust Header if needed
    df.attrs["name"] = name
    steps = [clean_headers, clean_columns, clean_deleted_rows, clean_flags, clean_format]
    for step in steps:
        df = step(df)
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce').dt.date
        log_cleaning("Normalized Date", df)
    return df

# ==============================
# EXCEL COLUMN AUTO-FIT
# ==============================
def autofit_columns(worksheet, max_width=40, min_width=4, padding=2):
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
        worksheet = writer.sheets["Sheet1"]

        # Auto-fit columns
        autofit_columns(worksheet)

        # Freeze header row
        worksheet.freeze_panes = worksheet["A2"]

        # Apply borders to all cells with data
        thin = Side(border_style="thin", color="000000")
        border = Border(left=thin, right=thin, top=thin, bottom=thin)

        for row in worksheet.iter_rows(min_row=1, max_row=worksheet.max_row,
                                       min_col=1, max_col=worksheet.max_column):
            for cell in row:
                if cell.value is not None:
                    cell.border = border

    log_cleaning("Saved File", df)
    return path
