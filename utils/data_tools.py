# ==============================
# DATA_TOOLS.PY
# ==============================

from flask import current_app

# ==============================
# REORDER NAMES
# ==============================
def reorder_name(value):
    """Reorders 'Last, First' to 'First Last' if applicable."""
    current_app.logger.debug(f"🔃 Applying reorder_name filter on: '{value}'")
    parts = value.split(", ")
    if len(parts) == 2:
        reordered = f"{parts[1]} {parts[0]}"
        current_app.logger.debug(f"✅ Reordered to: '{reordered}'")
        return reordered
    current_app.logger.debug("⚠️ Value did not match 'Last, First' format")
    return value
