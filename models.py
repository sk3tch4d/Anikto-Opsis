from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

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
    is_coverage = db.Column(db.Boolean, default=False)
    source_pdf = db.Column(db.String(256))  # trace back to file
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    notes = db.Column(db.Text)

    def __repr__(self):
        return f"<ShiftRecord {self.name} on {self.date} ({self.shift})>"

class CoverageShift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(16), nullable=False)
    start = db.Column(db.String(8), nullable=False)
    end = db.Column(db.String(8), nullable=False)
    type = db.Column(db.String(16), nullable=False)
    hours = db.Column(db.Float, nullable=False)
    org_name = db.Column(db.String(128), nullable=False)
    cov_name = db.Column(db.String(128), nullable=False)
    reason = db.Column(db.String(128))
    source_pdf = db.Column(db.String(256))  # trace back to file
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    modified_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    shift_record_id = db.Column(db.Integer, db.ForeignKey('shift_record.id'))
    shift_record = db.relationship('ShiftRecord', backref='coverage_entries')
    notes = db.Column(db.Text)

    def __repr__(self):
        return f"<CoverageShift {self.cov_name} covering {self.org_name} on {self.date} ({self.shift})>"

class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(128), nullable=False)
    last_name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(256), unique=True, nullable=True)
    status = db.Column(db.String(32), nullable=False)
    seniority = db.Column(db.Float, nullable=True)
    assignment = db.Column(db.String(16), nullable=True)
    notes = db.Column(db.Text)

    def __repr__(self):
        return f"<Employee {self.first_name} {self.last_name}>"
