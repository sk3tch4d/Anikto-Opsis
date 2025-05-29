# ==============================
# DEV_ROUTES.PY
# ==============================

from flask import Blueprint, request, jsonify, redirect, session, url_for, current_app
from config import DEV_MODE

# ==============================
# SETUP DEV BP
# ==============================

dev_bp = Blueprint("dev", __name__)

# ==============================
# DEV CHECK
# ==============================
@dev_bp.route("/check-dev")
def check_dev():
    dev_status = session.get("dev", False)
    current_app.logger.debug(f"🔍 /check-dev route hit — Current dev mode: {dev_status}")
    return jsonify({"dev": dev_status})

# ==============================
# DEV MODE
# ==============================
@dev_bp.route("/dev-mode", methods=["POST"])
def dev_mode():
    current_app.logger.debug("🚪 /dev-mode route hit")

    if request.is_json:
        data = request.get_json()
        token = data.get("token", "").strip().lower()
    else:
        token = request.form.get("token", "").strip().lower()

    current_app.logger.debug(f"🔑 Access Token received: {repr(token)}")

    if token in DEV_MODE:
        session["dev"] = True
        current_app.logger.info("✅ Dev mode enabled")
        if request.is_json:
            return jsonify(success=True)
        return redirect(url_for("index"))

    current_app.logger.warning("❌ Invalid dev mode token")
    if request.is_json:
        return jsonify(success=False), 401
    return redirect(url_for("index"))

# ==============================
# DEV LOGOUT
# ==============================
@dev_bp.route("/logout-dev")
def logout_dev():
    current_app.logger.debug("🚪 /logout-dev route hit")
    if "dev" in session:
        session.pop("dev")
        current_app.logger.info("🧹 Dev mode disabled")
    else:
        current_app.logger.debug("ℹ️ No active dev session to clear")
    return jsonify(success=True)
