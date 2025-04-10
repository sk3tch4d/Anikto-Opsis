import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from models import db, ShiftRecord, CoverageShift, Employee
from routes import register_routes

# Initialize Flask app
app = Flask(__name__)

# Set up logging
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize DB
db.init_app(app)

# Register routes
register_routes(app)

# Optional: Add a minimal health check
@app.route("/healthz")
def health_check():
    return "OK", 200
