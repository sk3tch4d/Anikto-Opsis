# ==============================
# INVENTORY_HANDLER.PY — CATALOG INVENTORY FLOW
# ==============================

from flask import render_template, current_app as app

# ==============================
# HANDLE CATALOG/COST CENTER INVENTORY DATAFRAME
# ==============================
def handle(df):
    try:
        import config
        config.INVENTORY_DF = df

        return render_template("inventory.html", table=[])

    except Exception as e:
        app.logger.error(f"Inventory handler failed: {e}")
        return render_template("index.html", error="Failed to process inventory file.")
