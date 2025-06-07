# ==============================
# INFO_LOGGING.PY
# ==============================

from flask import current_app, request, has_request_context
from user_agents import parse
import logging
import os
from logging.handlers import RotatingFileHandler

# ==============================
# NEW SESSION INFO
# ==============================
def new_session_info():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    ua_string = request.headers.get('User-Agent', '')
    ua = parse(ua_string)

    current_app.logger.info("--[ 📡 New Active Session ]--")
    current_app.logger.info(f"🌐 IP Address: {ip}")
    current_app.logger.info(f"🌐 Browser: {ua.browser.family} {ua.browser.version_string}")
    current_app.logger.info(f"🌐 OS: {ua.os.family} {ua.os.version_string}")
    current_app.logger.info(f"🌐 Device: {ua.device.family}")

# ==============================
# GENERAL INFO LOGGING
# ==============================
def log_info(log="", df=None, title="", message="", logger=None, level=logging.INFO):
    logger = logger or (current_app.logger if has_request_context() else logging.getLogger(__name__))
    name = df.attrs.get("name", "Unnamed") if df is not None else ""

    parts = [title, log, "→", name]
    if message:
        parts.append(f"— {message}")
    
    log_message = " ".join(part for part in parts if part)
    logger.log(level, log_message)

# ==============================
# RAW INFO LOGGING
# ==============================
def log_raw(message, logger=None, level=logging.INFO):
    logger = logger or (current_app.logger if has_request_context() else logging.getLogger(__name__))
    logger.log(level, message)

# ==============================
# SETUP LOG EXPORT
# ==============================
def setup_log_export(app, logs_dir="logs"):
    os.makedirs(logs_dir, exist_ok=True)

    all_handler = RotatingFileHandler(os.path.join(logs_dir, "all.log"), maxBytes=10240, backupCount=5)
    all_handler.setLevel(logging.DEBUG)
    all_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    ))

    info_handler = RotatingFileHandler(os.path.join(logs_dir, "session.log"), maxBytes=10240, backupCount=5)
    info_handler.setLevel(logging.INFO)
    info_handler.setFormatter(logging.Formatter(
        '%(asctime)s - %(message)s'
    ))

    if not app.logger.handlers:
        app.logger.addHandler(all_handler)
        app.logger.addHandler(info_handler)

    app.logger.setLevel(logging.DEBUG)
