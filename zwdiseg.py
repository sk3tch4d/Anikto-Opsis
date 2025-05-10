# ==============================
# ZWDISEG.PY (Final Optimized Version)
# ==============================

import pandas as pd

DEBUG = False

# ==============================
# LOAD ZWDISEG DATA
# ==============================
def load_zwdiseg_data(path):
    try:
        return pd.read_excel(path)
    except Exception as e:
        if DEBUG:
            print(f"[ERROR] Failed to load Excel: {e}")
        return None

# ==============================
# GET USLs
# ==============================
def get_zwdiseg_usls(df):
    if df is None or "USL" not in df.columns:
        return {"error": "zwdiseg not loaded or missing USL column."}, 400
    usls = sorted(df["USL"].dropna().unique().tolist())
    return usls

# ==============================
# SEARCH ZWDISEG
# ==============================
def search_zwdiseg(df, term, usl, sort="USL", direction="desc"):
    if df is None:
        return []

    df = df.copy()  # Avoid SettingWithCopyWarning or side effects

    term = term.strip().lower()
    usl = usl.strip().lower()
    
    if usl not in {"any", "all", ""}:
        df = df[df["USL"].astype(str).str.strip().str.lower() == usl]
    
    if term:
        try:
            search_cols = df.columns
            def row_matches(row):
                return any(term in str(row[col]).lower() for col in search_cols)
            df = df[df.apply(row_matches, axis=1)]
        except Exception as e:
            if DEBUG:
                print(f"[ERROR] Search failed: {e}")
            return []

    # Handle JSON serialization safely
    for col in ("Time", "Date"):
        if col in df.columns:
            df[col] = df[col].astype(str)

    # Validate sort field against actual DataFrame columns
    if sort not in df.columns:
        sort = "USL"

    df = df.sort_values(by=sort, ascending=(direction == "asc"))

    return df.head(1000).to_dict(orient="records")
