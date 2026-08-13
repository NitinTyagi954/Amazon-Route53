import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.connection import get_db_session
from app.models.user import User
from app.core.security import hash_password
EMAIL = 'admin@example.com'
PASSWORD = 'Admin@12345'
def main():
    with get_db_session() as db:
        existing = db.query(User).filter(User.email == EMAIL).first()
        if existing:
            print('[SKIP] User already exists id=' + existing.id)
            return
        user = User(
            email=EMAIL,
            hashed_password=hash_password(PASSWORD),
            full_name='Dev Admin',
            is_active=True,
        )
        db.add(user)
    print('[OK] Dev user created successfully')
if __name__ == '__main__':
    main()