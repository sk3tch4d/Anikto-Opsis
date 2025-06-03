# ==============================
# DATA_FORMAT.PY
# ==============================

import pandas as pd
from data_cleaner import log_cleaning

# ==============================
# FORMAT FILLRATE
# ==============================
def format_fillrate(df):
    if "Preferred" not in df.columns:
        log_cleaning("Skipped Fill Rate Clean — 'Preferred' column not detected", df)
        return df

    log_cleaning("Cleaning Fill Rate File", df)

    if "Description" not in df.columns:
        log_cleaning("Fill Rate Skipped — 'Description' column not found", df)
        return df

    # Strip "13-" prefix
    df["Preferred"] = df["Preferred"].astype(str).str.replace(r"^13-", "", regex=True)
    if "Sub 1" in df.columns:
        df["Sub 1"] = df["Sub 1"].astype(str).str.replace(r"^13-", "", regex=True)
    if "Sub 2" in df.columns:
        df["Sub 2"] = df["Sub 2"].astype(str).str.replace(r"^13-", "", regex=True)

    # Drop all-null or zero-value columns
    for col in df.columns:
        if df[col].apply(lambda x: pd.isna(x) or str(x).strip() in {"", "0", "0.0"}).all():
            df.drop(columns=col, inplace=True)

    # Remove duplicates by Description
    before = len(df)
    df = df.drop_duplicates(subset="Description", keep="first")
    after = len(df)
    log_cleaning("Fill Rate Cleaned", df, extra=f"{before - after} duplicates removed")

    # Sort Preferred numerically
    df["Preferred"] = pd.to_numeric(df["Preferred"], errors="coerce")
    df = df.sort_values(by="Preferred", na_position="last")

    # Reorder columns if they exist
    desired_order = [
        "Preferred", "Description", "Preferred ETA", "On-Hand",
        "Vendor", "Sub 1", "Sub ETA", "Sub 2", "Sub Stock"
    ]
    existing_order = [col for col in desired_order if col in df.columns]
    remaining_cols = [col for col in df.columns if col not in existing_order]
    df = df[existing_order + remaining_cols]

    return df

# ==============================
# FORMAT CART OPS
# ==============================
def format_cart_ops(df):
    if 'USL' in df.columns:
        usl_values = df['USL'].dropna().unique()
        if len(usl_values) == 1:
            bin_col_name = str(usl_values[0])
            if 'Bin' in df.columns:
                df.rename(columns={'Bin': bin_col_name}, inplace=True)
            df.drop(['USL', 'Group'], axis=1, errors='ignore', inplace=True)
            log_cleaning("Cart Ops Normalized", df, extra=f"Bin renamed to '{bin_col_name}'")

    # Insert an empty column (index 0)
    df.insert(0, ' ', np.nan)
    return df
