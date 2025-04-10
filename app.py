from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from models import db
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
        db.drop_all()  # drop all tables
        db.create_all()  # recreate tables
        print("✓ Tables created.")
    app.run(debug=True)
