import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from models import db, ShiftRecord, CoverageShift, Employee  # Import models before creating tables
from routes import register_routes

# Initialize Flask app
app = Flask(__name__)

# Set up logging to ensure all logs are captured
logging.basicConfig(level=logging.DEBUG)  # Set log level to DEBUG to capture everything
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
        app.logger.info("Dropping all tables...")  # Log the dropping process
        try:
            db.drop_all()  # Drop all tables in the database
            app.logger.info("Tables dropped.")
        except Exception as e:
            app.logger.error(f"Error dropping tables: {str(e)}")
        
        app.logger.info("Creating tables...")  # Log the creation process
        try:
            db.create_all()  # Recreate tables from models
            app.logger.info("✓ Tables created.")
        except Exception as e:
            app.logger.error(f"Error creating tables: {str(e)}")
    
    app.run(debug=True)
