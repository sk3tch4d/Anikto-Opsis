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

    logger.debug(f"[OPT_SEARCH]🧭 ENTERED search_optimization() with term={term!r}, cart={cart_filter}, sort={sort}, direction={direction}")

    if df is None or df.empty:
        logger.warning("[OPT_SEARCH]⚠️ OPTIMIZATION_DF is None or empty.")
        return []

    logger.info("[OPT_SEARCH]🔍 Running optimization search")
    logger.debug(f"[OPT_SEARCH]🔢 Initial DF shape: {df.shape}")
    logger.debug(f"[OPT_SEARCH]🧭 Search with sort='{sort}', direction='{direction}'")

    term = str(term).strip().lower()

    # ✅ Filter by Cart prefix
    if cart_filter and cart_filter != "All":
        prefix = cart_filter.split()[-1]
        df = df[df["bin"].astype(str).str.startswith(prefix)]
        logger.debug(f"[OPT_SEARCH]🧺 Filtered by Cart '{prefix}': {len(df)} rows remaining")

    # ✅ Log column headers
    logger.debug(f"[OPT_SEARCH]🧠 Columns in DataFrame: {df.columns.tolist()}")

    # ✅ Filter by search term
    if term:
        logger.debug(f"[OPT_SEARCH]🐣 Entered term filter block with term='{term}'")
        try:
            excluded = {"ROP", "ROQ", "RROP", "RROQ", "SROP", "SROQ", "CU1", "CU2", "QTY", "Created", "Last_Change"}
            
            logger.debug("[OPT_SEARCH]🧪 About to log df.columns")
            try:
                col_list = df.columns.tolist()
                logger.debug(f"[OPT_SEARCH]🧪 Column names before string_cols eval: {col_list}")
            except Exception as col_err:
                logger.error(f"[OPT_SEARCH]🛑 df.columns.tolist() failed: {col_err}", exc_info=True)
                raise
    
            logger.debug("[OPT_SEARCH]🧮 Evaluating string_cols")
            string_cols = [col for col in df.columns if col not in excluded and df[col].dtype == object]
            logger.debug(f"[OPT_SEARCH]🔤 Searching in columns: {string_cols}")
    
            logger.debug("[OPT_SEARCH]🧪 Applying row-wise search filter")
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
    
    # ✅ Log resolved sort column for debugging
    logger.debug(f"[OPT_SEARCH]🧭 Resolved sort column: '{sort}' from input: '{sort_key}'")
    logger.debug(f"[OPT_SEARCH]📁 Column map: {columns_map}")

    # ✅ Sorting
    try:
        df[sort] = pd.to_numeric(df[sort], errors="coerce")
        df = df.sort_values(by=sort, ascending=(direction == "asc"))
    except Exception as e:
        logger.warning(f"[OPT_SEARCH]❌ Failed to sort by '{sort}': {e}", exc_info=True)
    
    logger.debug(f"[OPT_SEARCH]📊 Final DF shape: {df.shape}")

    # ✅ Standardize return columns
    output_columns = [
        "Num", "Old", "Bin", "Description", "Group", "Cost_Center",
        "ROP", "ROQ", "SROP", "SROQ", "QTY", "CU1", "CU2"
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
