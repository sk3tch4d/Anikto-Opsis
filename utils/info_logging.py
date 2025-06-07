# ==============================
# INFO_LOGGING.PY
# ==============================

import os
import logging
from flask import current_app, request, has_request_context, send_file
from user_agents import parse
from logging.handlers import RotatingFileHandler

# ==============================
# SESSION INFO LOGGING
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
# GENERIC LOGGING UTILITIES
# ==============================

def log_info(log="", df=None, title="", message="", logger=None, level=logging.INFO):
    logger = logger or (current_app.logger if has_request_context() else logging.getLogger(__name__))
    name = df.attrs.get("name", "Unnamed") if df is not None else ""

    parts = [title, log, "→", name]
    if message:
        parts.append(f"— {message}")
    
    log_message = " ".join(part for part in parts if part)
    logger.log(level, log_message)

def log_raw(message, logger=None, level=logging.INFO):
    logger = logger or (current_app.logger if has_request_context() else logging.getLogger(__name__))
    logger.log(level, message)

# ==============================
# LOG HANDLER SETUP
# ==============================

def configure_logging(app, logs_dir="logs"):
    os.makedirs(logs_dir, exist_ok=True)

    handlers = []

    handlers.append(create_rotating_handler(
        os.path.join(logs_dir, "all.log"),
        level=logging.DEBUG,
        fmt='%(asctime)s - %(levelname)s - %(message)s'
    ))

    handlers.append(create_rotating_handler(
        os.path.join(logs_dir, "session.log"),
        level=logging.INFO,
        fmt='%(asctime)s - %(message)s'
    ))

    if not app.logger.handlers:
        for handler in handlers:
            app.logger.addHandler(handler)

    app.logger.setLevel(logging.DEBUG)

def create_rotating_handler(path, level, fmt):
    handler = RotatingFileHandler(path, maxBytes=10240, backupCount=5)
    handler.setLevel(level)
    handler.setFormatter(logging.Formatter(fmt))
    return handler

# ==============================
# LOG FILE EXPORT
# ==============================

def export_log(log_path, download_name):
    if not os.path.exists(log_path):
        current_app.logger.warning(f"❌ Log export failed — file not found: {log_path}")
        return None
    return send_file(log_path, as_attachment=True, download_name=download_name)
