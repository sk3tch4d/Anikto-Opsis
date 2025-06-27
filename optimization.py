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
    if cart_filter.lower() not in {"all", "any", ""}:
        cart_str = str(cart_filter).strip().lower()
        df = df[df["Cart"].astype(str).str.lower().str.strip() == cart_str]
        logger.debug(f"[OPT_SEARCH]🧺 Filtered by Cart '{cart_str}': {len(df)} rows remaining")
    else:
        logger.debug(f"[OPT_SEARCH]🛡️ Filter skipped (value: '{cart_filter}')")

    # ✅ Filter by search term
    term = str(term).strip().lower()
    if term:
        logger.debug(f"[OPT_SEARCH]🐣 Search term provided: '{term}'")
        try:
            excluded = {"ROP", "ROQ", "RROP", "RROQ", "SROP", "SROQ", "CU1", "CU2", "CC1", "CC2", "QTY", "UOM", "Cost", "MVT", "First"}

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
        logger.warning(f"[OPT_SEARCH]⚠️ Sort column '{sort}' not found. Falling back to 'QTY'")
        sort = "QTY"
    else:
        sort = columns_map[sort_key]

    logger.debug(f"[OPT_SEARCH]🧭 Resolved sort column: '{sort}' from input: '{sort_key}'")
    logger.debug(f"[OPT_SEARCH]📁 Column map: {columns_map}")

    # ✅ Sorting
    try:
        df = df.copy()  # Ensure we're not modifying a view
        df[sort] = pd.to_numeric(df[sort], errors="coerce")
        df = df.sort_values(by=sort, ascending=(direction == "asc"))
        logger.debug(f"[OPT_SEARCH]🔃 Sorted by '{sort}' in direction '{direction}'")
    except Exception as e:
        logger.warning(f"[OPT_SEARCH]❌ Failed to sort by '{sort}': {e}", exc_info=True)


    # ✅ Standardize return columns
    output_columns = [
        "USL", "Num", "Bin", "Description", "ROP", "ROQ", "RROP", "RROQ",
        "SROP", "SROQ", "QTY", "UOM", "Cost", "CU1", "CU2", "CC1", "CC2", 
        "Group", "First", "MVT", "Cart"
    ]
    for col in output_columns:
        if col not in df.columns:
            df[col] = ""

    df = df[output_columns].head(500).copy()

    # ✅ Final conversion
    try:
        result = df.to_dict(orient="records")
        logger.debug(f"[OPT_SEARCH]📦 Returning {len(result)} results.")
        return result
    except Exception as e:
        logger.exception("[OPT_SEARCH]🔥 CRITICAL: to_dict() failed")
        raise

# ==============================
# GENERATE SUGGESTED ROP ROQ
# ==============================
def suggest_rop_roq(df):
    def strategic_suggested_rop_roq(row):
        try:
            # Use normalized field names from headers
            cart_q = pd.to_numeric(row.get('CU1'), errors='coerce')
            cost_q = pd.to_numeric(row.get('CC1'), errors='coerce')
            cart_a = pd.to_numeric(row.get('CU2'), errors='coerce')
            cost_a = pd.to_numeric(row.get('CC2'), errors='coerce')
            prev_rop = pd.to_numeric(row.get('RROP'), errors='coerce')
            prev_roq = pd.to_numeric(row.get('RROQ'), errors='coerce')

            # Estimate daily usage
            usage_quarterly = np.nanmax([cart_q, cost_q]) / 90 if pd.notna(cart_q) or pd.notna(cost_q) else 0
            usage_annual = np.nanmax([cart_a, cost_a]) / 365 if pd.notna(cart_a) or pd.notna(cost_a) else 0
            daily_usage = max(usage_quarterly, usage_annual)

            if daily_usage == 0:
                return pd.Series([None, None])

            # Calculate base ROP and adjust with historical
            raw_rop = daily_usage * 3  # 3-day buffer
            adjusted_rop = max(raw_rop, prev_rop if pd.notna(prev_rop) else 0)

            # Round ROP to nearest 10 ending in 2
            rounded_rop = int(np.ceil(adjusted_rop / 10.0) * 10)
            while str(rounded_rop)[-1] != '2':
                rounded_rop += 1

            # Determine ROQ candidates
            base = rounded_rop - 2
            all_factors = [d for d in range(2, base) if base % d == 0]
            roq_range_min = max(2, int(0.05 * rounded_rop))
            roq_range_max = int(0.25 * rounded_rop)
            valid_roqs = [d for d in all_factors if roq_range_min <= d <= roq_range_max]

            if rounded_rop <= 10 and 1 not in valid_roqs:
                valid_roqs.insert(0, 1)

            if pd.notna(prev_roq) and valid_roqs:
                suggested_roq = min(valid_roqs, key=lambda x: abs(x - prev_roq))
            elif valid_roqs:
                suggested_roq = max(valid_roqs)
            else:
                suggested_roq = None

            return pd.Series([rounded_rop, suggested_roq])
        except Exception as e:
            print(f"Optimization error in row: {row.get('material', 'N/A')} — {e}")
            return pd.Series([None, None])

    df[['site_suggested_rop', 'site_suggested_roq']] = df.apply(strategic_suggested_rop_roq, axis=1)
    return df
