# ==============================
# OPTIMIZATION.PY
# ==============================

import pandas as pd
from flask import current_app as app

# ==============================
# SEARCH OPTIMIZATION
# ==============================
def search_optimization(df, term, cart_filter="All", sort="SROP", direction="desc"):
    logger = app.logger  # Safer than current_app in some async contexts

    if df is None or df.empty:
        logger.warning("[OPT_SEARCH]⚠️ OPTIMIZATION_DF is None or empty.")
        return []

    logger.info("[OPT_SEARCH]🔍 Running optimization search")
    logger.debug(f"[OPT_SEARCH]🔢 Initial DF shape: {df.shape}")
    logger.debug(f"[OPT_SEARCH]🧭 Reached search_optimization function with sort='{sort}', direction='{direction}'")

    # Normalize term
    term = str(term).lower().strip()
    logger.debug(f"[OPT_SEARCH]🔡 Normalized search term: '{term}'")

    # Filter by cart
    if cart_filter and cart_filter != "All":
        prefix = cart_filter.split()[-1]
        initial_count = len(df)
        df = df[df["bin"].astype(str).str.startswith(prefix)]
        logger.debug(f"[OPT_SEARCH]🧺 Filtered by Cart {prefix}: {initial_count} → {len(df)} rows")

    # Filter by term match
    if term:
        initial_count = len(df)
        mask = df.apply(
            lambda row: term in " ".join(str(v).lower() for v in row.values if pd.notna(v)),
            axis=1
        )
        df = df[mask]
        logger.debug(f"[OPT_SEARCH]🔍 Search match filter: {initial_count} → {len(df)} rows")

    # Log full column header list
    logger.debug(f"[OPT_SEARCH]🧠 Columns in DataFrame: {df.columns.tolist()}")

    # Sort block
    logger.debug("[OPT_SEARCH]🧭 Reached sort check...")
    if sort in df.columns:
        try:
            dtype = df[sort].dtype
            preview = df[sort].head(5).tolist()
            logger.debug(f"[OPT_SEARCH]🧪 '{sort}' column dtype: {dtype}")
            logger.debug(f"[OPT_SEARCH]🔎 Top values in '{sort}': {preview}")

            df = df.copy()
            df[sort] = pd.to_numeric(df[sort], errors="coerce")
            df = df.sort_values(by=sort, ascending=(direction == "asc"))
        except Exception as e:
            logger.warning(f"[OPT_SEARCH] ❌ Failed to sort by '{sort}': {e}", exc_info=True)
    else:
        logger.warning(f"[OPT_SEARCH]⚠️ Sort column '{sort}' not found in DF: {df.columns.tolist()}")

    logger.debug(f"[OPT_SEARCH]📊 Final DF shape: {df.shape}")
    try:
        result = df.to_dict(orient="records")
        logger.debug(f"[OPT_SEARCH]📦 Search results converted to list of dicts — sample: {result[0] if result else '[]'}")
        return result
    except Exception as e:
        logger.error(f"[OPT_SEARCH]❌ Failed to convert DataFrame to dict: {e}", exc_info=True)
        return []
