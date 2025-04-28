# ==============================
# INV_MERGER.PY
# Handle Inventory Sheet Merging
# ==============================

import pandas as pd
import os
from datetime import datetime

# ==============================
# SMART COLUMN MAPPING
# ==============================
COLUMN_RENAMES = {
    "sloc": "USL",
    "mat.#": "Material",
    "mat. #": "Material",
    "material": "Material",
    "material description": "Description",
    "un": "UOM",
    "u/m": "UOM",
    "net price": "Cost",
    "matl grp": "Group",
    "material group": "Group",
    "goup": "Group",
    "group": "Group",
    "replenishmt qty": "ROQ",
    "reorder point": "ROP",
    "old material number": "Old",
    "old material": "Old",
    "old": "Old",
    "created": "Created",
    "last_change": "Last_Change",
    "cost ctr": "Cost_Center",
    "cost center": "Cost_Center",
    "cost_center": "Cost_Center",
    "vendor's name": "Vendor Name",
    "vendor material numter": "Vendor Material",
    "vendor material number": "Vendor Material",
    "bin": "Bin",
    "assignment": "Assignment",
}

# ==============================
# NORMALIZE COLUMNS
# ==============================
def normalize_columns(df):
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True).str.lower()
    df.rename(columns={k: v for k, v in COLUMN_RENAMES.items() if k in df.columns}, inplace=True)
    df.rename(columns={"num": "Material"}, inplace=True)
    return df

# ==============================
# CREATE MERGE KEY
# ==============================
def create_merge_key(df):
    if 'Material' not in df.columns:
        df['Material'] = ''
    if 'USL' in df.columns:
        df['merge_key'] = df['Material'].fillna('').astype(str).str.strip().str.lower() + '_' + df['USL'].fillna('').astype(str).str.strip().str.lower()
    else:
        df['merge_key'] = df['Material'].fillna('').astype(str).str.strip().str.lower()
    return df

# ==============================
# MERGE INVENTORY SHEETS
# ==============================
def merge_inventory_final(main_stream, list_streams, allow_new_columns=True):
    main_df = pd.read_excel(main_stream)
    main_df = normalize_columns(main_df)
    main_df = create_merge_key(main_df)

    changes_log = []
    new_rows = []

    for list_stream in list_streams:
        list_df = pd.read_excel(list_stream)
        list_df = normalize_columns(list_df)
        list_df = create_merge_key(list_df)
        list_df = list_df.drop_duplicates(subset="merge_key", keep="first")

        update_map = list_df.set_index('merge_key').to_dict(orient='index')

        for key, update_data in update_map.items():
            if key in main_df['merge_key'].values:
                match_indices = main_df.index[main_df['merge_key'] == key].tolist()
                for idx in match_indices:
                    fields_updated = []
                    for col, new_val in update_data.items():
                        if col == 'merge_key':
                            continue
                        if pd.notna(new_val):
                            if col not in main_df.columns:
                                if allow_new_columns:
                                    main_df[col] = None
                                else:
                                    continue
                            if pd.isna(main_df.at[idx, col]) or main_df.at[idx, col] != new_val:
                                main_df.at[idx, col] = new_val
                                fields_updated.append(col)
                    if fields_updated:
                        changes_log.append({
                            "Action": "Updated",
                            "Material": main_df.at[idx, 'Material'],
                            "USL": main_df.at[idx, 'USL'] if 'USL' in main_df.columns else '',
                            "Fields": ", ".join(fields_updated)
                        })
            else:
                new_row = {col: val for col, val in update_data.items() if col != 'merge_key'}
                new_rows.append(new_row)
                changes_log.append({
                    "Action": "Added",
                    "Material": update_data.get('Material', ''),
                    "USL": update_data.get('USL', '') if 'USL' in update_data else '',
                    "Fields": "ALL"
                })

    # ==============================
    # HANDLE NEW ROWS
    # ==============================
    if new_rows:
        new_rows_df = pd.DataFrame(new_rows)
        for col in new_rows_df.columns:
            if col not in main_df.columns:
                main_df[col] = None
        main_df = pd.concat([main_df, new_rows_df], ignore_index=True)

    # ==============================
    # SAVE FINAL MERGED FILE
    # ==============================
    today = datetime.now().strftime("%Y-%m-%d")
    base_name = os.path.splitext(os.path.basename(main_stream))[0]
    merged_filename = f"{base_name}_merged_final_{today}.csv"
    merged_path = os.path.join("/tmp", merged_filename)

    main_df.drop(columns=['merge_key']).to_csv(merged_path, index=False)

    log_df = pd.DataFrame(changes_log)
    log_filename = f"{base_name}_log_final_{today}.csv"
    log_path = os.path.join("/tmp", log_filename)

    log_df.to_csv(log_path, index=False)

    preview_log = log_df.head()

    return merged_path, merged_filename, log_path, log_filename, preview_log
