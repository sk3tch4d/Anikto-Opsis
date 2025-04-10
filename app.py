from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import ShiftRecord, CoverageShift, Employee
from routes import register_routes
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///local.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

register_routes(app)

#if __name__ == "__main__":
#    app.run(debug=True)

if __name__ == "__main__":
    with app.app_context():
        print("Dropping all tables...")
        db.drop_all()  # Drops all tables in the database
        print("Tables dropped.")
        
        print("Creating tables...")
        db.create_all()  # Creates the tables from models
        print("✓ Tables created.")
    
    app.run(debug=True)
