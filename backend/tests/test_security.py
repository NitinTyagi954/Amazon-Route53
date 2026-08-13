"""Tests for app.core.security password hashing and verification."""

from app.core.security import hash_password, verify_password


def test_hash_password_returns_bcrypt_string():
    """hash_password() must return a non-empty bcrypt hash starting with '$2b$'."""
    hashed = hash_password("mysecretpassword")
    assert isinstance(hashed, str)
    assert hashed.startswith("$2b$")
    assert len(hashed) > 50


def test_hash_password_produces_unique_hashes():
    """Two calls with the same input must produce different salted hashes."""
    h1 = hash_password("samepassword")
    h2 = hash_password("samepassword")
    assert h1 != h2


def test_verify_password_correct():
    """verify_password() returns True for a matching plaintext / hash pair."""
    plain = "correct-horse-battery-staple"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True


def test_verify_password_wrong():
    """verify_password() returns False when the plaintext does not match."""
    hashed = hash_password("realpassword")
    assert verify_password("wrongpassword", hashed) is False


def test_verify_password_empty_plaintext():
    """Verifying an empty string against a non-empty hash must return False."""
    hashed = hash_password("notempty")
    assert verify_password("", hashed) is False


def test_hash_and_verify_unicode():
    """Unicode passwords must round-trip through hash and verify correctly."""
    plain = "contraseña-sécurité-パスワード"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True
    assert verify_password("wrong", hashed) is False
