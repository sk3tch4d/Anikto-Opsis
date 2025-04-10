from flask import Flask
from flask_sqlalchemy import SQLAlchemy
import os
from models import db, ShiftRecord, CoverageShift, Employee  # Import models before creating tables
from routes import register_routes

app = Flask(__name__)

# Use DATABASE_URL if present, otherwise fallback to local SQLite
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the SQLAlchemy object
db.init_app(app)

# Register routes
register_routes(app)

# Reset the database (drop and recreate tables)
if __name__ == "__main__":
    with app.app_context():
        app.logger.info("Dropping all tables...")  # Using Flask's logging system
        db.drop_all()  # Drop all tables in the database
        app.logger.info("Tables dropped.")
        
        app.logger.info("Creating tables...")  # Using Flask's logging system
        db.create_all()  # Recreate tables from models
        app.logger.info("✓ Tables created.")
    
    app.run(debug=True)
