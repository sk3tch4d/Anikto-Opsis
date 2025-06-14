# ==============================
# OPTIMIZE_HANDLER.PY — USL OPTIMIZER FLOW (MATCHING INVENTORY STRUCTURE)
# ==============================

import re
import config
from flask import render_template, current_app as app
from inv_optimizer import suggest_rop_roq

# ==============================
# CREATE CARTS COLUMN
# ==============================
def create_carts(df):
    # Try to auto-detect the column that looks like cart data (1A, 10B, etc.)
    cart_col_candidates = [
        col for col in df.columns
        if df[col].astype(str).str.match(r"^\d+[A-Z]$").any()
    ]

    if cart_col_candidates:
        bin_col = cart_col_candidates[0]
        df['Cart'] = df[bin_col].astype(str).str.extract(r'(\d+)')
        df['Cart'] = 'Cart ' + df['Cart']
    else:
        df['Cart'] = np.nan  # create empty column to avoid downstream KeyError

    return df

# ==============================
# HANDLE REQUEST FOR USL OPTIMIZATION
# ==============================
def handle(df, filename=None):
    try:
        if df is None or df.empty:
            raise ValueError("No inventory data provided")

        first_usl = df["USL"].dropna().astype(str).str.upper().iloc[0]
        match = re.match(r"([A-Z0-9]{1,4})", first_usl)
        if not match:
            return render_template("index.html", error="Invalid USL format in file.")            
        usl_code = match.group(1)

        if filename:
            pattern = rf"KG01[-_]?{usl_code}"
            if not re.search(pattern, filename, re.IGNORECASE):
                return render_template("index.html", error="Filename does not match USL code in contents.")

        df = create_carts(df)
        
        config.OPTIMIZATION_DF = df

        app.logger.info(f"Loaded Optimization: {df.shape[0]} rows × {df.shape[1]} columns")
        return render_template("optimization.html", table=[])

    except Exception as e:
        app.logger.error(f"Optimization handler failed: {e}")
        return render_template("optimization.html", error="Failed to process optimization file.")
