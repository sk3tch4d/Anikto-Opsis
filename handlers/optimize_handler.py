# ==============================
# OPTIMIZE_HANDLER.PY
# ==============================

import re
import config
from flask import render_template, current_app as app
from optimization import suggest_rop_roq
from utils.data_format import format_cart_ops
from utils.data_cleaner import save_cleaned_df, schedule_file_deletion

# ==============================
# CREATE HEURISTIC COPY
# ==============================
def create_heuristic(df, filename=None):
    if filename:
        populate_df = suggest_rop_roq(df.copy(deep=True))
        heuristic_df = populate_df.copy(deep=True)
        heuristic_path = save_cleaned_df(heuristic_df, filename=f"Heuristic_{filename}")
        config.HEURISTIC_FILE_PATH = heuristic_path
        schedule_file_deletion(heuristic_path)
        app.logger.info(f"📄 Heuristic Version Created: {heuristic_path}")
    else:
        app.logger.info("📄 Heuristic Version Skipped: No filename!")
    
# ==============================
# CREATE PRINTABLE COPY
# ==============================
def create_printable(df, filename=None):
    if filename:
        format_df = format_cart_ops(df.copy(deep=True))
        printable_df = format_df.copy(deep=True)
        printable_path = save_cleaned_df(printable_df, filename=f"Printable_{filename}")
        config.PRINTABLE_FILE_PATH = printable_path
        schedule_file_deletion(printable_path)
        app.logger.info(f"📄 Printable Version Created: {printable_path}")
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

        app.logger.debug(f"[DEBUG] START: Columns = {df.columns.tolist()}")

        # === CREATE PRINTABLE VERSION ===
        create_printable(df, filename)

        # === CREATE HEURISTIC VERSION ===
        create_heuristic(df, filename)

        app.logger.debug(f"[DEBUG] POST-PRINTABLE: Columns = {df.columns.tolist()}")

        # === CHECK FOR USL ===
        if "USL" not in df.columns or df["USL"].dropna().empty:
            app.logger.warning("[DEBUG] ❌ USL missing or empty in dataframe")
            return render_template("index.html", error="Missing or empty 'USL' column.")

        app.logger.debug(f"[DEBUG] ✅ USL column exists. Non-null count: {df['USL'].notna().sum()}")

        # === EXTRACT USL ===
        first_usl = df["USL"].dropna().astype(str).str.upper().iloc[0]
        match = re.match(r"([A-Z0-9]{1,4})", first_usl)
        if not match:
            return render_template("index.html", error="Invalid USL format in file.")
        usl_code = match.group(1)

        app.logger.debug(f"[DEBUG] USL Code Extracted: {usl_code}")

        # === OPTIMIZE FILE CHECK WITH USL IN FILENAME ===
        if filename:
            pattern = rf"KG01[-_]?{usl_code}"
            if not re.search(pattern, filename, re.IGNORECASE):
                return render_template("index.html", error="Filename does not match USL code in contents.")

        # === CREATE CARTS COLUMN ===
        df = create_carts(df)
        app.logger.debug(f"🧪 Optimization Handle: df shape = {df.shape}")
        config.OPTIMIZATION_DF = df

        app.logger.info(f"✅ Loaded Optimization: {df.shape[0]} rows × {df.shape[1]} columns")
        return render_template("optimization.html", table=[])

    except Exception as e:
        app.logger.error(f"❌ Optimization handler failed: {e}")
        return render_template("optimization.html", error="Failed to process optimization file.")
