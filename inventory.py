# ==============================
# INVENTORY HANDLERS
# ==============================
import pandas as pd


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
# SEARCH INVENTORY (with DEBUG)
# ==============================
def search_inventory(df, term, usl, sort="QTY", direction="desc"):
    if df is None:
        print("[DEBUG] Inventory dataframe is None.")
        return []

    original_count = len(df)
    term = term.strip().lower()

    print(f"[DEBUG] Starting search: term='{term}', usl='{usl}', sort='{sort}', direction='{direction}'")

    # ✅ Filter by USL
    if usl != "Any":
        before_usl = len(df)
        df = df[df["USL"].astype(str).str.strip().str.upper() == usl.strip().upper()]
        print(f"[DEBUG] USL filter '{usl}' applied: {before_usl} → {len(df)} rows")

    # ✅ Apply search
    if term:
        try:
            if term.isdigit():
                before_term = len(df)
                df = df[df[["Num", "Old"]].astype(str).apply(
                    lambda row: any(term in str(cell) for cell in row), axis=1
                )]
                print(f"[DEBUG] Numeric term filter '{term}' applied: {before_term} → {len(df)} rows")
            else:
                excluded = ["QTY", "UOM", "Created", "Last_Change", "ROP", "ROQ", "Cost"]
                search_cols = [col for col in df.columns if col not in excluded]

                def row_contains_term(row):
                    for col in search_cols:
                        val = str(row[col]).lower()
                        if term in val:
                            return True
                    return False

                before_term = len(df)
                df = df[df.apply(row_contains_term, axis=1)]
                print(f"[DEBUG] Text term filter '{term}' applied: {before_term} → {len(df)} rows")
        except Exception as e:
            print(f"[ERROR] Search failed on term '{term}': {e}")
            return []

    # ✅ Validate sort field
    valid_sort_fields = {"QTY", "USL", "Num", "Cost"}
    if sort not in valid_sort_fields:
        print(f"[DEBUG] Invalid sort field '{sort}', defaulting to 'QTY'")
        sort = "QTY"

    # ✅ Sort
    ascending = (direction == "asc")
    if sort in df.columns:
        try:
            df = df.sort_values(by=sort, ascending=ascending)
            print(f"[DEBUG] Sorted by '{sort}' in {'ascending' if ascending else 'descending'} order.")
        except Exception as e:
            print(f"[ERROR] Failed to sort by '{sort}': {e}")

    # ✅ Final output
    final_df = df[[
        "Num", "Old", "Bin", "Description", "USL",
        "QTY", "UOM", "Cost", "Group", "Cost_Center"
    ]].head(100)

    print(f"[DEBUG] Returning {len(final_df)} records from original {original_count}")
    return final_df.to_dict(orient="records")
