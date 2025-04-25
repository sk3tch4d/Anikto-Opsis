# ==============================
# INVENTORY.PY
# ==============================

import pandas as pd
DEBUG = False

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
    if df is None:
        return []

    term = term.strip().lower()
    if DEBUG:
        print(f"[DEBUG] Starting search: term='{term}', usl='{usl}', sort='{sort}', direction='{direction}'")

    # Filter by USL
    usl = usl.strip().lower()
    if usl not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]

    try:
        matches = pd.DataFrame()

        if term:
            # Primary number matches
            num_matches = df[df["Num"].astype(str).str.lower().str.contains(term, na=False)]
            old_matches = df[df["Old"].astype(str).str.lower().str.contains(term, na=False)]
            primary_matches = pd.concat([num_matches, old_matches])

            # Textual matches in all relevant fields
            excluded = ["QTY", "UOM", "Created", "Last_Change", "ROP", "ROQ", "Cost"]
            search_cols = [col for col in df.columns if col not in excluded]
            text_matches = df[df[search_cols].apply(
                lambda row: row.astype(str).str.lower().str.contains(term).any(), axis=1
            )]

            # Combine & deduplicate
            matches = pd.concat([primary_matches, text_matches]).drop_duplicates()

        else:
            matches = df

    except Exception as e:
        if DEBUG:
            print(f"[ERROR] Search failed: {e}")
        return []

    # Sort validation
    valid_sort_fields = {"QTY", "USL", "Num", "Cost"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    ascending = (direction == "asc")
    if sort in matches.columns:
        matches = matches.sort_values(by=sort, ascending=ascending)

    final_df = matches[[
        "Num", "Old", "Bin", "Description", "USL",
        "QTY", "UOM", "Cost", "Group", "Cost_Center"
    ]].head(100)

    if DEBUG:
        print(f"[DEBUG] Returning {len(final_df)} records from original {len(df)}")

    return final_df.to_dict(orient="records")
