"""Password, token, redirect and bounded image handling."""
import hashlib
import io
import re
import secrets
from pathlib import Path
from urllib.parse import unquote, urlsplit
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from PIL import Image, ImageOps, UnidentifiedImageError
from app.db import DomainError, uid

HASHER = PasswordHasher(time_cost=2, memory_cost=19456, parallelism=1)
DUMMY_HASH = HASHER.hash(secrets.token_urlsafe(32))
MAX_UPLOAD = 5 * 1024 * 1024

def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()

def token() -> str:
    return secrets.token_urlsafe(32)

def email_address(value: str) -> str:
    value = value.strip().casefold()
    if len(value) > 254 or not re.fullmatch(r'[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+', value):
        raise DomainError('email_invalid')
    return value

def password_hash(value: str) -> str:
    if len(value) < 12 or len(value) > 256:
        raise DomainError('password_short')
    return HASHER.hash(value)

def password_matches(hashed: str, value: str) -> bool:
    if len(value) > 256:
        return False
    try:
        return HASHER.verify(hashed, value)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

def safe_next(value: str | None) -> str:
    value = value or '/app'
    decoded = unquote(value)
    if not decoded.startswith('/') or decoded.startswith('//') or '\\' in decoded or any(ord(x) < 32 for x in decoded):
        return '/app'
    parts = urlsplit(decoded)
    return value if not parts.scheme and not parts.netloc else '/app'

def save_photo(data: bytes, folder: Path) -> str:
    if not data or len(data) > MAX_UPLOAD:
        raise DomainError('photo_invalid')
    try:
        with Image.open(io.BytesIO(data)) as source:
            if source.width * source.height > 20_000_000 or source.format not in ('JPEG','PNG','WEBP'):
                raise DomainError('photo_invalid')
            source.load()
            image = ImageOps.exif_transpose(source).convert('RGB')
            image.thumbnail((1600,1600))
            folder.mkdir(parents=True, exist_ok=True)
            filename = uid() + '.webp'
            image.save(folder / filename, 'WEBP', quality=85)
            return filename
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError) as exc:
        raise DomainError('photo_invalid') from exc
