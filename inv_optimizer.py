# ==============================
# INV_OPTIMIZER.PY
# ==============================

import pandas as pd
import numpy as np

# ==============================
# GENERATE SUGGESTED ROP ROQ
# ==============================
def suggest_rop_roq(df):
    def strategic_suggested_rop_roq(row):
        try:
            # Use normalized field names from headers
            cart_q = pd.to_numeric(row.get('cart_usage_1'), errors='coerce')
            cost_q = pd.to_numeric(row.get('cost_centre_usage_1'), errors='coerce')
            cart_a = pd.to_numeric(row.get('cart_usage_2'), errors='coerce')
            cost_a = pd.to_numeric(row.get('cost_centre_usage_2'), errors='coerce')
            prev_rop = pd.to_numeric(row.get('rop'), errors='coerce')
            prev_roq = pd.to_numeric(row.get('roq'), errors='coerce')

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
