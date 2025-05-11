# ==============================
# INVENTORY_HANDLER.PY — CATALOG INVENTORY FLOW
# ==============================

from flask import render_template, current_app as app

# ==============================
# HANDLE CATALOG/COST CENTER INVENTORY DATAFRAME
# ==============================
def handle(df=None):
    try:
        if df is None or df.empty:
            raise ValueError("No inventory data provided")

        import config
        config.INVENTORY_DF = df

        app.logger.info(f"Loaded inventory: {df.shape[0]} rows × {df.shape[1]} columns")
        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Inventory handler failed: {e}")
        return render_template("index.html", error="Failed to process inventory file.")
