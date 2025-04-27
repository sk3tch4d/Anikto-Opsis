# ==============================
# INV_CLEANER.PY - CLEAN XLSX
# ==============================

import pandas as pd
import re
import tempfile

COLUMN_RENAMES = {
    "Sloc": "USL",
    "Material": "Material",
    "Material Description": "Description",
    "Un": "UOM",
    "Matl grp": "Goup",
    "Replenishment qty": "ROQ",
    "Reorder point": "ROP",
    "Old Material Number": "Old Material",
    "Created": "Created"
}

REMOVE_COLUMNS = ["Stl", "Mat", "Pl", "Plnt"]

# ==============================
# CLEAN XLSX
# ==============================
def clean_xlsx(file_stream):
    df = pd.read_excel(file_stream)

    # Drop rows containing 'DELETED' in any cell
    df = df[~df.apply(lambda row: row.astype(str).str.contains('DELETED', case=False).any(), axis=1)]

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

    # Remove unwanted columns
    for col in ["Stl", "Mat", "Pl", "Plnt"]:
        if col in df.columns:
            df.drop(columns=col, inplace=True)

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

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx')
    cleaned_df.to_excel(tmp.name, index=False)
    tmp.close()

    return tmp.name
