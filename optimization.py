# ==============================
# OPTIMIZATION.PY
# ==============================

import pandas as pd

# ==============================
# SEARCH OPTIMIZATION
# ==============================
def search_optimization(df, term, cart_filter="All", sort="site_suggested_rop", direction="desc"):
    if df is None or df.empty:
        return []

    # Normalize term
    term = str(term).lower().strip()

    # Filter by cart (based on bin prefix match)
    if cart_filter and cart_filter != "All":
        prefix = cart_filter.split()[-1]  # e.g., "Cart 3" → "3"
        df = df[df["bin"].astype(str).str.startswith(prefix)]

    # Filter by search term match
    if term:
        mask = df.apply(
            lambda row: term in " ".join(str(v).lower() for v in row.values if pd.notna(v)),
            axis=1
        )
        df = df[mask]

    # Sort if column exists
    if sort in df.columns:
        df = df.copy()
        df[sort] = pd.to_numeric(df[sort], errors="coerce")
        df = df.sort_values(by=sort, ascending=(direction == "asc"))

    return df.to_dict(orient="records")
