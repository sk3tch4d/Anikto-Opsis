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
    "Sloc": "USL",
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
    "Vendor's Name": "Vendor Name",
    "Vendor material numTer": "Vendor Material"
}

REMOVE_COLUMNS = ["StL", "Mat", "Mat. #", "Pl", "Plnt", "Un.1", "Un.2", "Latex/Expiry Information", "MRPC", "Type"]

# ==============================
# CLEAN XLSX
# ==============================
def clean_xlsx(file_stream):
    df = pd.read_excel(file_stream)

    # Drop rows containing 'DELETED' in any cell
    mask = df.astype(str).applymap(lambda x: 'DELETED' in x.upper() if isinstance(x, str) else False)
    df = df[~mask.any(axis=1)]

    # Drop rows where 'Mat' or 'Pl' is 'X'
    for col in ['Mat', 'Pl']:
        if col in df.columns:
            df = df[df[col] != 'X']

    # Drop rows where Material Description starts with XX or XXX
    if 'Material Description' in df.columns:
        pattern = r'^(XX|XXX)'
        df = df[~df['Material Description'].astype(str).str.match(pattern)]

    # Handle duplicate 'Un' column issue
    un_cols = [col for col in df.columns if col == 'Un']
    if len(un_cols) > 1:
        cols = []
        un_counter = 0
        for col in df.columns:
            if col == 'Un':
                un_counter += 1
                if un_counter == 1:
                    continue  # Skip the first 'Un'
            cols.append(col)
        df = df[cols]

    # Print columns removed
    dropped_cols = [col for col in REMOVE_COLUMNS if col in df.columns]
    if dropped_cols:
        print(f"Dropped columns: {', '.join(dropped_cols)}")
    
    # Remove unwanted columns
    df.drop(columns=[col for col in REMOVE_COLUMNS if col in df.columns], inplace=True)
    
    # Rename columns
    df.rename(columns={k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}, inplace=True)

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
