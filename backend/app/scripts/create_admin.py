"""Create or promote a platform administrator from environment variables."""
import os
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User

def main():
    email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "")
    if not email or len(password) < 10:
        raise SystemExit("Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 10 characters).")
    db: Session = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if user:
            user.role = "admin"
            user.is_active = True
            user.password_hash = hash_password(password)
        else:
            user = User(email=email, password_hash=hash_password(password), role="admin", is_active=True)
            db.add(user)
        db.commit()
        print(f"Admin account ready: {email}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
