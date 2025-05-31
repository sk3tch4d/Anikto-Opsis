# ==============================
# INFO_LOGGING.PY
# ==============================

from flask import request, current_app
from user_agents import parse
import logging

# ==============================
# NEW SESSION INFO
# ==============================
def new_session_info():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    ua_string = request.headers.get('User-Agent', '')
    ua = parse(ua_string)

    current_app.logger.info("--[ New Active Session ]--")
    current_app.logger.info(f"IP Address: {ip}")
    current_app.logger.info(f"Browser: {ua.browser.family} {ua.browser.version_string}")
    current_app.logger.info(f"OS: {ua.os.family} {ua.os.version_string}")
    current_app.logger.info(f"Device: {ua.device.family}")
