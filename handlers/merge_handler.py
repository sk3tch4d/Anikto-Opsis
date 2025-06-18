# ==============================
# MERGE_HANDLER.PY
# ==============================

import sqlite3
import pandas as pd
import os
import re
from data_cleaner import clean_xlsx, clean_db, clean_headers, clean_columns

# ==============================
# CONFIGS
# ==============================

DB_PATH = "./static/Cat_V7.7.db"
XLSX_PATH = "./Catalog-June-2025.xlsx"
TABLE_NAME = "Inventory"
MATCH_KEYS = ["USL", "Num"]

# ==============================
# GET NEXT DB VERSION
# ==============================
def get_next_db_version(path):
    base, ext = os.path.splitext(path)
    match = re.search(r"(.*_V)(\d+\.\d+)$", base)
    if not match:
        raise ValueError("Invalid DB version filename")
    prefix, version = match.groups()
    major, minor = map(int, version.split("."))
    new_version = f"{major}.{minor + 1}"
    return f"{prefix}{new_version}{ext}"

# ==============================
# LOAD DB TO DF
# ==============================
def load_db_to_df(db_path, table):
    conn = sqlite3.connect(db_path)
    df = pd.read_sql_query(f"SELECT * FROM {table}", conn)
    conn.close()
    return df

# ==============================
# WRITE DF TO DB
# ==============================
def write_df_to_db(df, db_path, table):
    conn = sqlite3.connect(db_path)
    df.to_sql(table, conn, if_exists="replace", index=False)
    conn.commit()
    conn.close()

# ==============================
# MERGE AND UPDATE
# ==============================
def merge_and_update(db_df, new_df):
    db_df.set_index(MATCH_KEYS, inplace=True)
    new_df.set_index(MATCH_KEYS, inplace=True)

    for idx, row in new_df.iterrows():
        if idx in db_df.index:
            for col, val in row.items():
                if pd.notna(val):
                    db_df.at[idx, col] = val
        else:
            db_df.loc[idx] = row

    db_df.reset_index(inplace=True)
    return db_df

# ==============================
# MAIN
# ==============================
def main():
    # Load and clean Excel
    with open(XLSX_PATH, "rb") as xlsx_stream:
        new_df = clean_xlsx(
            xlsx_stream,
            clean_headers,
            clean_columns,
            detect_header=True,
            multi_sheet=False
        )

    # Load and clean DB
    db_df = load_db_to_df(DB_PATH, TABLE_NAME)
    db_df = clean_db(db_df)

    # Merge/update
    updated_df = merge_and_update(db_df, new_df)

    # Save updated DB
    new_db_path = get_next_db_version(DB_PATH)
    write_df_to_db(updated_df, new_db_path, TABLE_NAME)
    print(f"✅ DB updated and saved to: {new_db_path}")


if __name__ == "__main__":
    main()
