# ==============================
# ZWDISEG HANDLERS
# ==============================

import pandas as pd
DEBUG = False

# ==============================
# ZWDISEG DATA
# ==============================
def load_zwdiseg_data(path):
    df = pd.read_excel(path).fillna("")
    df.columns = [c.strip() for c in df.columns]
    return df


# ==============================
# ZWDISEG USLS
# ==============================
def get_zwdiseg_usls(df):
    if df is None:
        return {"error": "zwdiseg not loaded."}, 400
    usls = sorted(df["USL"].dropna().unique().tolist())
    return usls


# ==============================
# SEARCH ZWDISEG
# ==============================
def search_zwdiseg(df, term, usl, sort="QTY", direction="desc"):
    if df is None:
        return []

    term = term.strip().lower()
    if DEBUG:
        print(f"[DEBUG] Starting search: term='{term}', usl='{usl}', sort='{sort}', direction='{direction}'")

    # ✅ Filter by USL
    usl = usl.strip().lower()
    if usl not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]

    try:
        if term:
            excluded = [
                "Departmental Inventory Record",
                "Item",
                "Year",
                "Plnt",
                "Counted qty.1",
                "Valuated Unrestricted-Use Stoc",
                "Valuated Unrestricted-Use Stoc.1",
                "Reorder point for storage loca.1",
                "Replenishment quantity for slo.1",
                "BUn",
                "Difference Quantity from Dep.I.1",
                "Quantity Posted from Dep.Inven.1",
                "Mat. Doc.",
                "MatYr",
                "Item.1",
                "Status of count",
                "DSt",
                "Reason Text for Departmental I"
            ]
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
    valid_sort_fields = {"QTY", "USL", "Num", "Time", "ROP", "ROQ"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    ascending = (direction == "asc")
    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=ascending)

    final_df = df[[
        "Name", "SLoc", "Cost Ctr", "Material", "Counted qty",
        "Reorder point for storage loca", "Replenishment quantity for slo",
        "Difference Quantity from Dep.I", "Quantity Posted from Dep.Inven",
        "Dif", "MvT", "Count date", "Time", "Material Description"
    ]].head(100)

    if DEBUG:
        print(f"[DEBUG] Returning {len(final_df)} records from original {len(df)}")

    return final_df.to_dict(orient="records")
