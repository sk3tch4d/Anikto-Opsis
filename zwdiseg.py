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

    if usl.strip().lower() not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]

    try:
        if term:
            def row_matches(row):
                return any(term in str(row[col]).lower() for col in df.columns)
            df = df[df.apply(row_matches, axis=1)]
    except Exception as e:
        print(f"[ERROR] Search failed: {e}")
        return []

    # Handle JSON serialization safely
    if "Time" in df.columns:
        df["Time"] = df["Time"].astype(str)

    # Optional: Handle Date serialization as well (usually safe, but...)
    if "Date" in df.columns:
        df["Date"] = df["Date"].astype(str)

    # Sorting and trimming...
    valid_sort_fields = {"QTY", "USL", "Num", "Time", "ROP", "ROQ"}
    if sort not in valid_sort_fields:
        sort = "QTY"

    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=(direction == "asc"))

    return df.head(1000).to_dict(orient="records")
