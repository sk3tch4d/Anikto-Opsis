# ==============================
# INVENTORY.PY
# ==============================

import pandas as pd
DEBUG = True

# ==============================
# INVENTORY DATA
# ==============================
def load_inventory_data(path):
    df = pd.read_excel(path).fillna("")
    df.columns = [c.strip() for c in df.columns]
    return df

# ==============================
# INVENTORY USLS
# ==============================
def get_inventory_usls(df):
    if df is None:
        return {"error": "Inventory not loaded."}, 400
    usls = sorted(df["USL"].dropna().unique().tolist())
    return usls


# ==============================
# SEARCH INVENTORY
# ==============================
def search_inventory(df, term, usl, sort="QTY", direction="desc"):
    print("DF in memory:", df.shape)
    print("Columns:", df.columns.tolist())

    if df is None:
        return []

    term = term.strip().lower()
    if DEBUG:
        print(f"[SEARCH]🔎 Starting search: term='{term}', usl='{usl}', sort='{sort}', direction='{direction}'")

    # ✅ Filter by USL
    usl = usl.strip().lower()
    if usl not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]

    try:
        if term:
            excluded = ["QTY", "UOM", "Created", "Last_Change", "ROP", "ROQ", "Cost"]
            search_cols = [col for col in df.columns if col not in excluded]

            # Unified row-wise search
            def row_matches(row):
                for col in search_cols:
                    value = str(row[col]).lower()
                    if term in value:
                        return True
                return False

            mask = df.apply(row_matches, axis=1)
            df = df[mask]

    except Exception as e:
        if DEBUG:
            print(f"[ERROR] Search failed: {e}")
        return []

    # ✅ Validate sort field
    valid_sort_fields = {"QTY", "USL", "Num", "Cost"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    ascending = (direction == "asc")
    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=ascending)

    final_df = df[[
        "Num", "Old", "Bin", "Description", "USL",
        "QTY", "UOM", "Cost", "Group", "Cost_Center"
    ]].head(100)

    if DEBUG:
        print(f"[DEBUG] Returning {len(final_df)} records from original {len(df)}")

    return final_df.to_dict(orient="records")
