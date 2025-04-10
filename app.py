import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from models import db, ShiftRecord, CoverageShift, Employee  # Import models before creating tables
from routes import register_routes

# Initialize Flask app
app = Flask(__name__)

# Configure logging to capture all logs (DEBUG level)
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# Set the database URI (PostgreSQL or SQLite)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize SQLAlchemy
db.init_app(app)

# Register routes
register_routes(app)

# Reset the database (drop and recreate tables)
if __name__ == "__main__":
    with app.app_context():
        app.logger.debug("Dropping all tables...")  # Debug level log
        try:
            db.drop_all()  # Drop all tables in the database
            app.logger.debug("Tables dropped.")
        except Exception as e:
            app.logger.error(f"Error dropping tables: {str(e)}")
        
        app.logger.debug("Creating tables...")  # Debug level log
        try:
            db.create_all()  # Recreate tables from models
            app.logger.debug("✓ Tables created.")
        except Exception as e:
            app.logger.error(f"Error creating tables: {str(e)}")
    
    app.run(debug=True)
