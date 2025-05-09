# ==============================
# ZWDISEG.PY
# ==============================

import pandas as pd
DEBUG = False

# ==============================
# LOAD ZWDISEG DATA
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
def search_zwdiseg(df, term, usl, sort="USL", direction="desc"):
    if df is None:
        return []

    term = term.strip().lower()
    usl = usl.strip().lower()
    
    # Always apply USL filter if it's specified
    if usl not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]
    
    # Only apply search filter if term is provided
    if term:
        try:
            search_cols = df.columns
    
            def row_matches(row):
                return any(term in str(row[col]).lower() for col in search_cols)
    
            mask = df.apply(row_matches, axis=1)
            df = df[mask]
    
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
    valid_sort_fields = {"USL", "Num", "Counted", "New_QTY", "Difference", "ROP", "ROQ", "Time"}
    if sort not in valid_sort_fields:
        sort = "USL"
    
    if sort in df.columns:
        df = df.sort_values(by=sort, ascending=(direction == "asc"))

    # Return all under 1000 rows
    return df.head(1000).to_dict(orient="records")
