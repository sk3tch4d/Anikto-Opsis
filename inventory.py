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
# SEARCH INVENTORY
# ==============================
# ==============================
# SEARCH INVENTORY
# ==============================
def search_inventory(df, term, usl, sort="QTY", direction="desc"):
    if df is None:
        return []

    term = term.strip().lower()

    # ✅ Filter by USL
    if usl != "Any":
        df = df[df["USL"].astype(str).str.strip().str.upper() == usl.strip().upper()]

    # ✅ Apply search
    if term:
        if term.isdigit():
            df = df[df[["Num", "Old"]].astype(str).apply(
                lambda row: any(term in str(cell) for cell in row), axis=1
            )]
        else:
            excluded = {"QTY", "UOM", "Created", "Last_Change", "ROP", "ROQ", "Cost"}
            search_cols = [col for col in df.columns if col not in excluded and df[col].dtype == object]

            # Ensure everything is a string and lowercase for matching
            df = df[df[search_cols].apply(
                lambda row: any(term in str(val).lower() for val in row if pd.notna(val)),
                axis=1
            )]

    # ✅ Validate sort field
    valid_sort_fields = {"QTY", "USL", "Num", "Cost"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    # ✅ Sort
    ascending = (direction == "asc")
    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=ascending)

    return df[[
        "Num", "Old", "Bin", "Description", "USL",
        "QTY", "UOM", "Cost", "Group", "Cost_Center"
    ]].head(100).to_dict(orient="records")

