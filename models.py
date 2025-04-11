
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

# Employee Model
class Employee(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    first_name = db.Column(db.String(128), nullable=False)
    last_name = db.Column(db.String(128), nullable=False)
    email = db.Column(db.String(256), unique=True, nullable=True)
    status = db.Column(db.String(32), nullable=False)  # e.g., Full-time, Part-time
    seniority = db.Column(db.Float, nullable=True)
    assignment = db.Column(db.String(16), nullable=True)  # Optional assignment code
    notes = db.Column(db.Text)  # Any additional notes
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)

    def __repr__(self):
        return f"<Employee {self.first_name} {self.last_name}>"

# ShiftRecord Model (linked to Employee)
class ShiftRecord(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)  # Link to Employee
    employee = db.relationship('Employee', backref='shift_records')  # Access employee's shifts
    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(64), nullable=False)
    start = db.Column(db.String(8), nullable=False)
    end = db.Column(db.String(8), nullable=False)
    type = db.Column(db.String(16), nullable=False)  # E.g., Day, Evening, Night
    day_type = db.Column(db.String(16), nullable=False)  # Weekday or Weekend
    hours = db.Column(db.Float, nullable=False)
    is_coverage = db.Column(db.Boolean, default=False)
    source_pdf = db.Column(db.String(256))  # File source
    file_date = db.Column(db.Date, nullable=True)  # Date associated with source PDF
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    notes = db.Column(db.Text)

    def __repr__(self):
        return f"<ShiftRecord {self.employee.first_name} {self.employee.last_name} on {self.date} ({self.shift})>"

# CoverageShift Model (linked to Employee)
class CoverageShift(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    shift = db.Column(db.String(16), nullable=False)
    start = db.Column(db.String(8), nullable=False)
    end = db.Column(db.String(8), nullable=False)
    type = db.Column(db.String(16), nullable=False)  # E.g., Day, Evening, Night
    day_type = db.Column(db.String(16))  # Weekday or Weekend
    hours = db.Column(db.Float, nullable=False)

    # Employee being covered (org_employee)
    org_employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    org_employee = db.relationship('Employee', foreign_keys=[org_employee_id], backref='coverage_shifts_org')  # Original employee

    # Employee who is covering (cov_employee)
    cov_employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    cov_employee = db.relationship('Employee', foreign_keys=[cov_employee_id], backref='coverage_shifts_cov')  # Covering employee

    reason = db.Column(db.String(128))  # Reason for coverage (e.g., sick leave)
    source_pdf = db.Column(db.String(256))  # File source
    file_date = db.Column(db.Date, nullable=True)  # Date associated with source PDF
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, onupdate=datetime.utcnow)
    notes = db.Column(db.Text)

    def __repr__(self):
        return f"<CoverageShift {self.cov_employee.first_name} covering {self.org_employee.first_name} on {self.date} ({self.shift})>"
