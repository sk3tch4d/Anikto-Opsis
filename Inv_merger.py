# ==============================
# INV_MERGER.PY
# Handle Inventory Sheet Merging
# ==============================

import pandas as pd
import os
from datetime import datetime

# ==============================
# UTILITY: NORMALIZE COLUMNS
# ==============================
def normalize_columns(df):
    df.columns = df.columns.str.strip().str.replace(r"\s+", " ", regex=True)
    df.rename(columns={"Num": "Material"}, inplace=True)
    return df

# ==============================
# UTILITY: AUTOFIT COLUMNS
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
# MAIN MERGE FUNCTION
# ==============================
def merge_inventory(main_stream, list_streams, allow_new_columns=True, excluded_columns=None):
    if excluded_columns is None:
        excluded_columns = []

    # Load main catalog
    main_df = pd.read_excel(main_stream)
    main_df = normalize_columns(main_df)

    changes_log = []

    for list_stream in list_streams:
        list_df = pd.read_excel(list_stream)
        list_df = normalize_columns(list_df)

        # Check key columns
        has_usl = 'USL' in list_df.columns and 'USL' in main_df.columns
        
        # Try matching and updating
        for idx, update_row in list_df.iterrows():
            material = str(update_row.get('Material', '')).strip()
            description = str(update_row.get('Description', '')).strip()
            usl = str(update_row.get('USL', '')).strip() if has_usl else None

            if not material and description:
                # Fallback to description matching
                match_condition = main_df['Description'].fillna('').str.strip().str.lower() == description.lower()
            else:
                # Material matching
                match_condition = main_df['Material'].fillna('').astype(str).str.strip().str.lower() == material.lower()
                
            if has_usl and usl:
                match_condition &= main_df['USL'].fillna('').astype(str).str.strip().str.lower() == usl.lower()

            matches = main_df[match_condition]

            if matches.empty:
                # Append new row
                append_row = update_row.to_dict()
                main_df = pd.concat([main_df, pd.DataFrame([append_row])], ignore_index=True)
                changes_log.append({
                    "Action": "Added", 
                    "Material": material, 
                    "USL": usl, 
                    "Fields": "ALL"
                })
            else:
                # Update all matches
                for match_idx in matches.index:
                    fields_updated = []
                    for col in update_row.index:
                        if col in excluded_columns:
                            continue
                        
                        new_val = update_row[col]
                        if pd.notna(new_val) and (col not in main_df.columns or main_df.at[match_idx, col] != new_val):
                            if allow_new_columns and col not in main_df.columns:
                                main_df[col] = None
                            main_df.at[match_idx, col] = new_val
                            fields_updated.append(col)
                    if fields_updated:
                        changes_log.append({
                            "Action": "Updated", 
                            "Material": material, 
                            "USL": usl, 
                            "Fields": ", ".join(fields_updated)
                        })

    # Save merged file
    today = datetime.now().strftime("%Y-%m-%d")
    base_name = os.path.splitext(os.path.basename(main_stream.filename))[0]
    merged_filename = f"{base_name}_merged_{today}.xlsx"
    merged_path = os.path.join("/tmp", merged_filename)

    with pd.ExcelWriter(merged_path, engine="openpyxl") as writer:
        main_df.to_excel(writer, index=False, sheet_name='Merged')
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

    return merged_path, merged_filename, log_path, log_filename
