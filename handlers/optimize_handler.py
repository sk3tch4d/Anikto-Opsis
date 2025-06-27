# ==============================
# OPTIMIZE_HANDLER.PY
# ==============================

import re
import config
from flask import render_template, current_app as app
from inv_optimizer import suggest_rop_roq
from utils.data_format import format_cart_ops
from utils.data_cleaner import save_cleaned_df, schedule_file_deletion

# ==============================
# CREATE PRINTABLE COPY
# ==============================
def create_printable(df, filename=None):
    if filename:
        format_df = format_cart_ops(df)
        printable_df = format_df.copy(deep=True)
        printable_path = save_cleaned_df(printable_df, filename=f"printable_{filename}")
        config.PRINTABLE_FILE_PATH = printable_path
        schedule_file_deletion(printable_path)
        app.logger.info(f"📄 Created Printable Version: {printable_path}")
    else:
        app.logger.info("📄 Printable Version Skipped: No filename!")
            
# ==============================
# CREATE CARTS COLUMN
# ==============================
def create_carts(df):
    # === ATTEMP AUTO DETECT BIN DATA (1A, 10B, etc.) ===
    cart_col_candidates = [
        col for col in df.columns
        if df[col].astype(str).str.match(r"^\d+[A-Z]$").any()
    ]

    # === CHECK AND CREATE CART COLUMN ===
    if cart_col_candidates:
        bin_col = cart_col_candidates[0]
        df['Cart'] = df[bin_col].astype(str).str.extract(r'(\d+)')
        df['Cart'] = 'Cart ' + df['Cart']
    else:
        df['Cart'] = np.nan  # == Empty column to avoid downstream KeyError

    return df

# ==============================
# HANDLE REQUEST FOR USL OPTIMIZATION
# ==============================
def handle(df, filename=None):
    try:
        if df is None or df.empty:
            raise ValueError("No inventory data provided")

        # === CREATE PRINTABLE VERSION ===
        create_printable(df, filename)
        
        # === EXTRACT USL ===
        first_usl = df["USL"].dropna().astype(str).str.upper().iloc[0]
        match = re.match(r"([A-Z0-9]{1,4})", first_usl)
        if not match:
            return render_template("index.html", error="Invalid USL format in file.")            
        usl_code = match.group(1)

        # === OPTIMIZE FILE CHECK WITH USL IN FILENAME ===
        if filename:
            pattern = rf"KG01[-_]?{usl_code}"
            if not re.search(pattern, filename, re.IGNORECASE):
                return render_template("index.html", error="Filename does not match USL code in contents.")

        # === CREATE CARTS COLUMN ===
        df = create_carts(df)
        config.OPTIMIZATION_DF = df

        # === LOAD OPTIMIZATION ===
        app.logger.info(f"Loaded Optimization: {df.shape[0]} rows × {df.shape[1]} columns")
        return render_template("optimization.html", table=[])

    except Exception as e:
        app.logger.error(f"Optimization handler failed: {e}")
        return render_template("optimization.html", error="Failed to process optimization file.")
