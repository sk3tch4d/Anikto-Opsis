# ==============================
# APP.PY
# ==============================

import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from models import db, ShiftRecord, CoverageShift, Employee
from routes import register_routes
from routes.inventory_routes import inventory_bp

# ==============================
# INITIALIZE FLASK APP
# ==============================
app = Flask(__name__)
app.secret_key = "False"

# ==============================
# SETUP LOGGING
# ==============================
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# ==============================
# SILENCE PDFMINER
# ==============================
logging.getLogger("pdfminer").setLevel(logging.WARNING)

# ==============================
# SETUP DATABASE CONFIG
# ==============================
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# ==============================
# INITIALIZE DATABASE
# ==============================
db.init_app(app)

# ==============================
# REGISTER ROUTES
# ==============================
register_routes(app)

# Add a minimal health check
@app.route("/healthz")
def health_check():
    return "OK", 200
