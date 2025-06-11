# ==============================
# OPTIMIZATION.PY
# ==============================

import pandas as pd
from flask import current_app as app

# ==============================
# SEARCH OPTIMIZATION
# ==============================
def search_optimization(df, term, cart_filter="All", sort="SROP", direction="desc"):
    logger = app.logger

    if df is None or df.empty:
        logger.warning("[OPT_SEARCH]⚠️ OPTIMIZATION_DF is None or empty.")
        return []

    logger.info("[OPT_SEARCH]🔍 Running optimization search")
    logger.debug(f"[OPT_SEARCH]🔢 Initial DF shape: {df.shape}")
    logger.debug(f"[OPT_SEARCH]🧭 Search with sort='{sort}', direction='{direction}'")

    term = str(term).strip().lower()

    # Filter by Cart prefix
    if cart_filter and cart_filter != "All":
        prefix = cart_filter.split()[-1]
        df = df[df["bin"].astype(str).str.startswith(prefix)]
        logger.debug(f"[OPT_SEARCH]🧺 Filtered by Cart {prefix}, now {len(df)} rows")

    # Filter by search term across relevant columns
    if term:
        try:
            excluded = {"ROP", "ROQ", "RROP", "RROQ", "SROP", "SROQ", "CU1", "CU2", "QTY", "Created", "Last_Change"}
            search_cols = [col for col in df.columns if col not in excluded and df[col].dtype == object]
            logger.debug(f"[OPT_SEARCH]🔤 Searching in columns: {search_cols}")

            df = df[df[search_cols].apply(
                lambda row: any(term in str(val).lower() for val in row if pd.notna(val)),
                axis=1
            )]
            logger.debug(f"[OPT_SEARCH]🔍 Search result count: {len(df)}")
        except Exception as e:
            logger.warning(f"[OPT_SEARCH]⚠️ Term filtering failed: {e}", exc_info=True)

    # Sorting
    if sort in df.columns:
        try:
            df[sort] = pd.to_numeric(df[sort], errors="coerce")
            df = df.sort_values(by=sort, ascending=(direction == "asc"))
        except Exception as e:
            logger.warning(f"[OPT_SEARCH]❌ Failed to sort by '{sort}': {e}", exc_info=True)
    else:
        logger.warning(f"[OPT_SEARCH]⚠️ Sort column '{sort}' not found in DF.")

    logger.debug(f"[OPT_SEARCH]📊 Final DF shape: {df.shape}")

    try:
        result = df.to_dict(orient="records")
        logger.debug(f"[OPT_SEARCH]📦 Returning {len(result)} results.")
        return result
    except Exception as e:
        logger.error(f"[OPT_SEARCH]❌ Failed to convert DataFrame to dict: {e}", exc_info=True)
        return []
