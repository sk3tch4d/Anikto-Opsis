# ==============================
# DATA_FORMAT.PY
# ==============================

import pandas as pd
import numpy as np
import logging

# ==============================
# LOGGING UTIL
# ==============================
def log_format(log="", df=None, extra=""):
    name = df.attrs.get("name", "Unnamed") if df is not None else ""
    logging.debug(f"[FORMAT]📐 {log} → {name}{f' — {extra}' if extra else ''}")

# ==============================
# FORMAT FILLRATE
# ==============================
def format_fillrate(df):
    if "Preferred" not in df.columns:
        log_format("Skipped Fill Rate Clean — 'Preferred' column not detected", df)
        return df

    log_format("Cleaning Fill Rate File", df)

    if "Description" not in df.columns:
        log_format("Fill Rate Skipped — 'Description' column not found", df)
        return df

    if "Cost" in df.columns: # If/Remove Cost
        df = df.drop(columns=["Cost"])

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
    log_format("Fill Rate Cleaned", df, extra=f"[{before - after}] duplicates removed")

    # Sort Preferred numerically
    df["Preferred"] = pd.to_numeric(df["Preferred"], errors="coerce")
    df = df.sort_values(by="Preferred", na_position="last")

    # Reorder columns if they exist
    desired_order = [
        "Preferred", "Description", "Preferred ETA", "Stock",
        "Vendor", "Sub 1", "Sub ETA", "Sub 2", "Sub Stock"
    ]
    existing_order = [col for col in desired_order if col in df.columns]
    remaining_cols = [col for col in df.columns if col not in existing_order]
    df = df[existing_order + remaining_cols]

    # Rename 'Preferred' to the first 'Date' value and drop 'Date'
    if "Date" in df.columns:
        first_date = df["Date"].dropna().astype(str).iloc[0] if not df["Date"].dropna().empty else None
        if first_date:
            df.rename(columns={"Preferred": first_date}, inplace=True)
            df.drop(columns="Date", inplace=True)
            log_format(f"Renamed 'Preferred' to '{first_date}' and dropped 'Date'", df)

    return df

# ==============================
# FORMAT CART OPS
# ==============================
def format_cart_ops(df):
    # RENAME BIN
    if 'USL' in df.columns:
        usl_values = df['USL'].dropna().unique()
        if len(usl_values) == 1:
            bin_col_name = str(usl_values[0])
            if 'Bin' in df.columns:
                df.rename(columns={'Bin': bin_col_name}, inplace=True)
            df.drop(['USL', 'Group'], axis=1, errors='ignore', inplace=True)
            log_format("Cart Ops Normalized", df, extra=f"Bin renamed to '{bin_col_name}'")

    # PRECEDING BLANK ROW FOR PRINT SPACER
    df.insert(0, ' ', np.nan)

    return df
