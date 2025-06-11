# ==============================
# OPTIMIZATION.PY
# ==============================

import pandas as pd
from flask import current_app as app

# ==============================
# SEARCH OPTIMIZATION
# ==============================
def search_optimization(df, term, cart_filter="All", sort="Num", direction="desc"):
    logger = app.logger

    logger.debug(f"[OPT_SEARCH]🧭 ENTERED search_optimization() with term={term!r}, cart={cart_filter}, sort={sort}, direction={direction}")

    if df is None or df.empty:
        logger.warning("[OPT_SEARCH]⚠️ OPTIMIZATION_DF is None or empty.")
        return []

    logger.info("[OPT_SEARCH]🔍 Running optimization search")
    logger.debug(f"[OPT_SEARCH]🔢 Initial DF shape: {df.shape}")
    logger.debug(f"[OPT_SEARCH]🧠 Columns: {df.columns.tolist()}")

    # ✅ Normalize cart filter input
    cart_filter = str(cart_filter).strip()
    if cart_filter.lower() not in {"all", "any", ""}:
        prefix = cart_filter.split()[-1]
        df = df[df["bin"].astype(str).str.startswith(prefix)]
        logger.debug(f"[OPT_SEARCH]🧺 Filtered by Cart '{prefix}': {len(df)} rows remaining")
    else:
        logger.debug(f"[OPT_SEARCH]🛡️ Cart filter skipped (value: '{cart_filter}')")

    # ✅ Filter by search term
    term = str(term).strip().lower()
    if term:
        logger.debug(f"[OPT_SEARCH]🐣 Search term provided: '{term}'")
        try:
            excluded = {"RROP", "RROQ", "SROP", "SROQ", "CU1", "CU2", "CC1", "CC2", "QTY"}

            try:
                col_list = df.columns.tolist()
                logger.debug(f"[OPT_SEARCH]🧪 Column names before string_cols eval: {col_list}")
            except Exception as col_err:
                logger.error(f"[OPT_SEARCH]🛑 df.columns.tolist() failed: {col_err}", exc_info=True)
                raise

            string_cols = [col for col in df.columns if col not in excluded and df[col].dtype == object]
            logger.debug(f"[OPT_SEARCH]🔤 Searching in columns: {string_cols}")

            df = df[df[string_cols].apply(
                lambda row: any(term in str(val).lower() for val in row if pd.notna(val)),
                axis=1
            )]
            logger.debug(f"[OPT_SEARCH]🔍 Rows after search: {len(df)}")

        except Exception as e:
            logger.warning(f"[OPT_SEARCH]⚠️ Search filtering failed: {e}", exc_info=True)

    # ✅ Normalize sort key by case
    columns_map = {col.lower(): col for col in df.columns}
    sort_key = sort.lower()
    if sort_key not in columns_map:
        logger.warning(f"[OPT_SEARCH]⚠️ Sort column '{sort}' not found. Falling back to 'SROP'")
        sort = "SROP"
    else:
        sort = columns_map[sort_key]

    logger.debug(f"[OPT_SEARCH]🧭 Resolved sort column: '{sort}' from input: '{sort_key}'")
    logger.debug(f"[OPT_SEARCH]📁 Column map: {columns_map}")

    # ✅ Sorting
    try:
        df[sort] = pd.to_numeric(df[sort], errors="coerce")
        df = df.sort_values(by=sort, ascending=(direction == "asc"))
        logger.debug(f"[OPT_SEARCH]🔃 Sorted by '{sort}' in direction '{direction}'")
    except Exception as e:
        logger.warning(f"[OPT_SEARCH]❌ Failed to sort by '{sort}': {e}", exc_info=True)

    logger.debug(f"[OPT_SEARCH]📊 Final DF shape: {df.shape}")

    # ✅ Standardize return columns
    output_columns = [
        "Num", "Bin", "Description", "Group", "ROP", "ROQ", 
        "SROP", "SROQ", "QTY", "CU1", "CU2", "CC1", "CC2", "First", "MVT"
    ]
    for col in output_columns:
        if col not in df.columns:
            df[col] = ""
    df = df[output_columns].head(100)

    # ✅ Final conversion
    try:
        result = df.to_dict(orient="records")
        logger.debug(f"[OPT_SEARCH]📦 Returning {len(result)} results.")
        return result
    except Exception as e:
        logger.error(f"[OPT_SEARCH]❌ Failed to convert to dict: {e}", exc_info=True)
        return []
