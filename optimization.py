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
        logger.warning("⚠️ OPTIMIZATION_DF is None or empty.")
        return []

    logger.info("🔍 Running optimization search")
    logger.debug(f"🔢 Initial DF shape: {df.shape}")

    # Normalize term
    term = str(term).lower().strip()
    logger.debug(f"🔡 Normalized search term: '{term}'")

    # Filter by cart
    if cart_filter and cart_filter != "All":
        prefix = cart_filter.split()[-1]
        initial_count = len(df)
        df = df[df["bin"].astype(str).str.startswith(prefix)]
        logger.debug(f"🧺 Filtered by Cart {prefix}: {initial_count} → {len(df)} rows")

    # Filter by term match
    if term:
        initial_count = len(df)
        mask = df.apply(
            lambda row: term in " ".join(str(v).lower() for v in row.values if pd.notna(v)),
            axis=1
        )
        df = df[mask]
        logger.debug(f"🔍 Search match filter: {initial_count} → {len(df)} rows")

    logger.debug(f"🧠 Columns in DF at search time: {df.columns.tolist()}")

    # Sort if applicable
    if sort in df.columns:
        try:
            # Try to preview dtype and values before sorting
            try:
                dtype = df[sort].dtype
                preview = df[sort].head(5).tolist()
                logger.debug(f"🧪 '{sort}' column dtype: {dtype}")
                logger.debug(f"🔎 Top values in '{sort}': {preview}")
            except Exception as inspect_err:
                logger.warning(f"⚠️ Failed to inspect column '{sort}': {inspect_err}", exc_info=True)

            df = df.copy()
            df[sort] = pd.to_numeric(df[sort], errors="coerce")
            df = df.sort_values(by=sort, ascending=(direction == "asc"))
        except Exception as e:
            logger.warning(f"[SEARCH] ❌ Failed to sort by '{sort}': {e}", exc_info=True)
    else:
        logger.warning(f"⚠️ Sort column '{sort}' not found in DF columns: {df.columns.tolist()}")

    logger.debug(f"📊 Final DF shape: {df.shape}")

    try:
        result = df.to_dict(orient="records")
        logger.debug(f"📦 Search results converted to list of dicts — sample: {result[0] if result else '[]'}")
        return result
    except Exception as e:
        logger.error(f"❌ Failed to convert DataFrame to dict: {e}", exc_info=True)
        return []
