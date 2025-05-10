# ==============================
# ZWDISEG_HANDLER.PY
# ==============================

from flask import render_template, current_app as app

# ==============================
# ROP Validation Logic
# ==============================
def is_below_rop(rop, counted):
    try:
        rop_val = float(rop)
        counted_val = float(counted)
        return counted_val < rop_val
    except (ValueError, TypeError):
        return False

# ==============================
# HANDLE ZWDISEG DATAFRAME
# ==============================
def handle(df):
    try:
        import config

        # ==============================
        # Add Valid Column
        # ==============================
        df = df.copy()
        
        # Boolean
        # df["Valid"] = df.apply(lambda row: is_below_rop(row.get("ROP"), row.get("Counted")), axis=1)
        
        # String
        df["Valid"] = df.apply(lambda row: str(is_below_rop(row.get("ROP"), row.get("Counted"))).lower(), axis=1)

        # ==============================
        # Reorder Columns (After Valid)
        # ==============================
        COLS_ORDER = [
            "Cost_Center", "USL", "Num", "Description", "ROP", "ROQ", "Counted", "Consumed",
            "Difference", "Changed", "MVT", "Name", "Date", "Time", "Valid"
        ]
        
        df_order = [col for col in COLS_ORDER if col in df.columns]
        remaining = [col for col in df.columns if col not in df_order]
        df = df[df_order + remaining]

        # ==============================
        # Store and Render
        # ==============================
        config.ZWDISEG_DF = df
        return render_template("zwdiseg.html", table=[])

    # ==============================
    # EXCEPTION AND RETURN
    # ==============================
    except Exception as e:
        app.logger.error(f"Zwdiseg handler failed: {e}")
        return render_template("index.html", error="Failed to process zwdiseg file.")
