"""Password hashing and verification utilities.

Uses bcrypt via passlib for secure, salted password hashing.
This module provides two helpers:
  - hash_password(plain):   returns a bcrypt hash string
  - verify_password(plain, hashed): returns True if the plain text matches

No login / session / JWT logic lives here; this is purely the
cryptographic building-block for future authentication work.
"""

from passlib.context import CryptContext

# Single shared context – bcrypt is the only configured scheme.
# "deprecated='auto'" means passlib will transparently re-hash if the
# default rounds/algorithm ever changes in a future upgrade.
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """Return a bcrypt hash of *plain_password*."""
    return _pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return ``True`` when *plain_password* matches *hashed_password*."""
    return _pwd_context.verify(plain_password, hashed_password)
