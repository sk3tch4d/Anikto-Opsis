from app import app, db

with app.app_context():
    print("Dropping all tables...")
    db.drop_all()
    print("Tables dropped.")
    
    print("Creating tables...")
    db.create_all()
    print("✓ Tables created.")
