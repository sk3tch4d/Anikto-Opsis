# ==============================
# INV_MERGER.PY
# Handle Inventory Sheet Merging
# ==============================

import pandas as pd
import os
from datetime import datetime

# ==============================
# UTILITY: Normalize columns
# ==============================
def normalize_columns(df):
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)
    df.rename(columns={"Num": "Material"}, inplace=True)
    return df

# ==============================
# UTILITY: Create merge keys
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
# UTILITY: Autofit columns
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
# MAIN: Fast Merge Inventory
# ==============================
def merge_inventory_fast(main_stream, list_streams, allow_new_columns=True, excluded_columns=None):
    if excluded_columns is None:
        excluded_columns = []

    # Load main catalog
    main_df = pd.read_excel(main_stream)
    main_df = normalize_columns(main_df)
    main_df = create_merge_key(main_df)

    changes_log = []

    for list_stream in list_streams:
        list_df = pd.read_excel(list_stream)
        list_df = normalize_columns(list_df)
        list_df = create_merge_key(list_df)

        # Identify matching rows
        update_map = list_df.set_index('merge_key').to_dict(orient='index')

        for key, update_data in update_map.items():
            if key in main_df['merge_key'].values:
                match_indices = main_df.index[main_df['merge_key'] == key].tolist()

                for idx in match_indices:
                    fields_updated = []
                    for col, new_val in update_data.items():
                        if col in ['merge_key'] or col in excluded_columns:
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
                # No match: append new row
                new_row = {col: val for col, val in update_data.items() if col != 'merge_key'}
                main_df = pd.concat([main_df, pd.DataFrame([new_row])], ignore_index=True)
                changes_log.append({
                    "Action": "Added",
                    "Material": update_data.get('Material', ''),
                    "USL": update_data.get('USL', '') if 'USL' in update_data else '',
                    "Fields": "ALL"
                })

    # Save merged file
    today = datetime.now().strftime("%Y-%m-%d")
    base_name = os.path.splitext(os.path.basename(main_stream.filename))[0]
    merged_filename = f"{base_name}_merged_{today}.xlsx"
    merged_path = os.path.join("/tmp", merged_filename)

    with pd.ExcelWriter(merged_path, engine="openpyxl") as writer:
        main_df.drop(columns=['merge_key']).to_excel(writer, index=False, sheet_name='Merged')
        workbook = writer.book
        worksheet = writer.sheets['Merged']
        autofit_columns(worksheet)

    # Save log report
    log_df = pd.DataFrame(changes_log)
    log_filename = f"{base_name}_log_{today}.xlsx"
    log_path = os.path.join("/tmp", log_filename)

    with pd.ExcelWriter(log_path, engine="openpyxl") as writer:
        log_df.to_excel(writer, index=False, sheet_name='Changes')
        workbook = writer.book
        worksheet = writer.sheets['Changes']
        autofit_columns(worksheet)

    # Preview first 5 changes
    preview_log = log_df.head()

    return merged_path, merged_filename, log_path, log_filename, preview_log
