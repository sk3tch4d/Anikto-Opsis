# ==============================
# INVENTORY HANDLERS
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

    # ✅ Filter by USL
    if usl != "Any":
        df = df[df["USL"].astype(str).str.strip().str.upper() == usl.strip().upper()]

    # ✅ Apply search
    if term:
        try:
            if term.isdigit():
                before = len(df)

                primary = df[df["Num"].astype(str).str.contains(term)]
                if not primary.empty:
                    df = primary
                    source = "Num"
                else:
                    fallback = df[df["Old"].astype(str).str.contains(term)]
                    df = fallback
                    source = "Old (fallback)"
            
                after = len(df)
                if DEBUG:
                    print(f"[DEBUG] Numeric term '{term}' matched in {source}: {before} → {after} rows")

            else:
                excluded = ["QTY", "UOM", "Created", "Last_Change", "ROP", "ROQ", "Cost"]
                search_cols = [col for col in df.columns if col not in excluded]
                df = df[df[search_cols].astype(str).apply(
                    lambda row: row.str.lower().str.contains(term).any(), axis=1
                )]
        except Exception as e:
            if DEBUG:
                print(f"[ERROR] Search failed: {e}")
            return []

    # ✅ Validate sort field
    valid_sort_fields = {"QTY", "USL", "Num", "Cost"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    # ✅ Sort
    ascending = (direction == "asc")
    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=ascending)
        if DEBUG:
            print(f"[DEBUG] Sorted by '{sort}' in {'ascending' if ascending else 'descending'} order.")

    final_df = df[[
        "Num", "Old", "Bin", "Description", "USL",
        "QTY", "UOM", "Cost", "Group", "Cost_Center"
    ]].head(100)

    if DEBUG:
        print(f"[DEBUG] Returning {len(final_df)} records from original {len(df)}")

    return final_df.to_dict(orient="records")
