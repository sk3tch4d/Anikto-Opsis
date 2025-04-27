# ==============================
# INV_CLEANER.PY - CLEAN XLSX
# ==============================

import pandas as pd
import re
import os
import tempfile
from datetime import datetime

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

REMOVE_COLUMNS = ["StL", "Mat", "Pl", "Plnt", "Un.1", "Un.2", "Latex/Expiry Information", "Person responsible", "Stge loc. descr.", "MRPC", "Type", "Plant", "Del"]

# ==============================
# CLEAN XLSX
# ==============================
def clean_xlsx(file_stream):
    df = pd.read_excel(file_stream)

    # 1. Rename columns immediately to standardize names
    df.rename(columns={k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}, inplace=True)

    # 2. Drop rows where 'Description' starts with XX or XXX
    if 'Description' in df.columns:
        pattern = r'^(XX|XXX)'
        df = df[~df['Description'].astype(str).str.match(pattern)]

    # 3. Drop rows containing 'DELETED' in any cell
    mask = df.astype(str).applymap(lambda x: 'DELETED' in x.upper() if isinstance(x, str) else False)
    df = df[~mask.any(axis=1)]

    # 4. Drop rows where 'Mat', 'Pl', 'Del' is 'X'
    for col in ['Mat', 'Pl', 'Del']:
        if col in df.columns:
            df = df[df[col] != 'X']

    # 5. Handle duplicate 'UOM' columns
    uom_cols = [col for col in df.columns if col == 'UOM']
    if len(uom_cols) > 1:
        cols = []
        uom_counter = 0
        for col in df.columns:
            if col == 'UOM':
                uom_counter += 1
                if uom_counter == 1:
                    continue  # Keep first
            cols.append(col)
        df = df[cols]

    # 6. Drop unwanted columns
    dropped_cols = [col for col in REMOVE_COLUMNS if col in df.columns]
    if dropped_cols:
        print(f"Dropped columns: {', '.join(dropped_cols)}")
    df.drop(columns=dropped_cols, inplace=True)

    return df

# ==============================
# CLEANER SAVE AND RETURN
# ==============================
def clean_xlsx_and_save(file_stream):
    if not file_stream.filename.lower().endswith('.xlsx'):
        raise ValueError("Invalid file format. Please upload an .xlsx file.")

    cleaned_df = clean_xlsx(file_stream)

    base_filename = os.path.splitext(os.path.basename(file_stream.filename))[0]
    today = datetime.now().strftime("%Y-%m-%d")  # 👈 today's date
    cleaned_filename = f"{base_filename}_cleaned_{today}.xlsx"  # 👈 now includes date
    cleaned_path = os.path.join("/tmp", cleaned_filename)

    cleaned_df.to_excel(cleaned_path, index=False)

    return cleaned_path, cleaned_filename
