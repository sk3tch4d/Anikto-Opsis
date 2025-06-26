# ==============================
# DEV_ROUTES.PY
# ==============================

from flask import Blueprint, request, jsonify, redirect, session, url_for, current_app
from utils.dev_mode import generate_dev_code
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
    current_app.logger.debug(f" 🔍 Dev Check Route — Dev Mode: {dev_status}")
    return jsonify({"dev": dev_status})

# ==============================
# ROLLING DEV CODE
# ==============================
@dev_bp.route("/dev-code")
def get_dev_code():
    return jsonify({"dev_code": generate_dev_code()})

# ==============================
# DEV MODE
# ==============================
@dev_bp.route("/dev-mode", methods=["POST"])
def dev_mode():
    current_app.logger.debug(" 🚪 Dev Mode Routing")

    if request.is_json:
        data = request.get_json()
        token = data.get("token", "").strip().lower()
    else:
        token = request.form.get("token", "").strip().lower()

    current_app.logger.debug(f" 🔑 Access Token Received: {repr(token)}")

    if token in DEV_MODE:
        session["dev"] = True
        current_app.logger.info(" ✅ Dev Mode: Enabled")
        if request.is_json:
            return jsonify(success=True)
        return redirect(url_for("index"))

    current_app.logger.warning(f" ❌ Invalid Dev Mode Token: {repr(token)}")
    if request.is_json:
        return jsonify(success=False), 401
    return redirect(url_for("index"))

# ==============================
# DEV LOGOUT
# ==============================
@dev_bp.route("/logout-dev")
def logout_dev():
    current_app.logger.debug(" 🚪 Dev Mode: Logout Routing")
    if "dev" in session:
        session.pop("dev")
        current_app.logger.info(" 🔒 Dev mode: Disabled")
    else:
        current_app.logger.debug(" ℹ️ No Active Dev Session!")
    return jsonify(success=True)
