# ==============================
# ZWDISEG.PY
# ==============================

import pandas as pd
DEBUG = False

# ==============================
# LOAD ZWDISEG DATA (via cleaner, no re-cleaning here)
# ==============================
def load_zwdiseg_data(path):
    return pd.read_excel(path)


# ==============================
# GET USLs
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

    # ✅ Filter by USL
    usl = usl.strip().lower()
    if usl not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]

    try:
        if term:
            search_cols = df.columns

            def row_matches(row):
                return any(term in str(row[col]).lower() for col in search_cols)

            mask = df.apply(row_matches, axis=1)
            df = df[mask]

    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []

    # ✅ Validate sort field
    valid_sort_fields = {"QTY", "USL", "Num", "Time", "ROP", "ROQ"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    ascending = (direction == "asc")
    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=ascending)

    # Trim to top 100 with expected columns (optional safeguard)
    columns_to_show = [
        "Name", "SLoc", "Cost Ctr", "Material", "Counted qty",
        "Reorder point for storage loca", "Replenishment quantity for slo",
        "Difference Quantity from Dep.I", "Quantity Posted from Dep.Inven",
        "Dif", "MvT", "Count date", "Time", "Material Description"
    ]
    columns_to_show = [col for col in columns_to_show if col in df.columns]

    final_df = df[columns_to_show].head(100)
    return final_df.to_dict(orient="records")
