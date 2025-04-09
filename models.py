from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class ShiftRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(128), nullable=False)
    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(64), nullable=False)
    start = db.Column(db.String(8), nullable=False)
    end = db.Column(db.String(8), nullable=False)
    type = db.Column(db.String(16), nullable=False)
    hours = db.Column(db.Float, nullable=False)
    source_file = db.Column(db.String(256))
