# ==============================
# LOGS_ROUTES.PY
# ==============================

import os
from flask import Blueprint, request, Response, current_app

# ==============================
# SETUP FILE BP
# ==============================

log_view_bp = Blueprint("log_view", __name__)

# ==============================
# LOG VIEW ROUTING
# ==============================
@log_view_bp.route("/view-log")
def view_log():
    log_type = request.args.get("type", "info")
    log_file = "logs/session.log" if log_type == "info" else "logs/all.log"

    if not os.path.exists(log_file):
        current_app.logger.warning(f"❌ Tried to view missing log file: {log_file}")
        return Response("Log file not found.", status=404)

    with open(log_file, "r") as f:
        content = f.read()

    return Response(content, mimetype="text/plain")
