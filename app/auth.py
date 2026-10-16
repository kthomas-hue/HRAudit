"""Admin authentication (password hash + signed cookie session)."""

from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import time
from typing import Any

from fastapi import HTTPException, Request, Response

from db import dumps, get_conn, init_db, loads, now_iso, transaction

COOKIE_NAME = "hrhc_admin"
PBKDF2_ITERS = 210_000


def _secret() -> bytes:
    raw = os.environ.get("HRHC_SECRET") or os.environ.get("ADMIN_SECRET")
    if not raw:
        # Stable per-DB default so restarts keep sessions in demo/dev.
        # Set HRHC_SECRET in production.
        raw = "dreamstonehr-dev-secret-change-me"
    return raw.encode("utf-8")


def hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PBKDF2_ITERS)
    return f"pbkdf2_sha256${PBKDF2_ITERS}${salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algo, iters_s, salt_hex, digest_hex = stored.split("$", 3)
        if algo != "pbkdf2_sha256":
            return False
        iters = int(iters_s)
        salt = bytes.fromhex(salt_hex)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iters)
        return hmac.compare_digest(digest.hex(), digest_hex)
    except Exception:
        return False


def ensure_default_admin() -> None:
    init_db()
    conn = get_conn()
    row = conn.execute("SELECT id FROM admins LIMIT 1").fetchone()
    if row:
        return
    email = os.environ.get("ADMIN_EMAIL", "admin@dreamstonehr.com.au").strip().lower()
    password = os.environ.get("ADMIN_PASSWORD", "dreamstone")
    with transaction() as conn:
        conn.execute(
            "INSERT INTO admins (email, password_hash, created_at) VALUES (?, ?, ?)",
            (email, hash_password(password), now_iso()),
        )
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)",
            ("product_name", dumps("HR Health Check")),
        )


def _sign(payload: str) -> str:
    sig = hmac.new(_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{payload}.{sig}"


def _unsign(token: str, max_age_sec: int = 60 * 60 * 24 * 14) -> dict[str, Any] | None:
    try:
        payload, sig = token.rsplit(".", 1)
        expected = hmac.new(_secret(), payload.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        data = loads(payload, {})
        if not isinstance(data, dict):
            return None
        ts = int(data.get("ts", 0))
        if time.time() - ts > max_age_sec:
            return None
        return data
    except Exception:
        return None


def set_admin_cookie(response: Response, admin_id: int, email: str) -> None:
    payload = dumps({"aid": admin_id, "email": email, "ts": int(time.time())})
    response.set_cookie(
        COOKIE_NAME,
        _sign(payload),
        httponly=True,
        samesite="lax",
        max_age=60 * 60 * 24 * 14,
        path="/",
    )


def clear_admin_cookie(response: Response) -> None:
    response.delete_cookie(COOKIE_NAME, path="/")


def current_admin(request: Request) -> dict[str, Any] | None:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        return None
    data = _unsign(token)
    if not data:
        return None
    conn = get_conn()
    row = conn.execute(
        "SELECT id, email FROM admins WHERE id = ?",
        (data.get("aid"),),
    ).fetchone()
    if not row:
        return None
    return {"id": row["id"], "email": row["email"]}


def require_admin(request: Request) -> dict[str, Any]:
    admin = current_admin(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Admin login required")
    return admin


def authenticate(email: str, password: str) -> dict[str, Any] | None:
    conn = get_conn()
    row = conn.execute(
        "SELECT id, email, password_hash FROM admins WHERE email = ?",
        (email.strip().lower(),),
    ).fetchone()
    if not row or not verify_password(password, row["password_hash"]):
        return None
    return {"id": row["id"], "email": row["email"]}


def update_admin_password(admin_id: int, new_password: str) -> None:
    if len(new_password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    with transaction() as conn:
        conn.execute(
            "UPDATE admins SET password_hash = ? WHERE id = ?",
            (hash_password(new_password), admin_id),
        )
