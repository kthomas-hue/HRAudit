"""SQLite persistence for the owned HR Health Check product."""

from __future__ import annotations

import json
import os
import sqlite3
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator

REPO = Path(__file__).resolve().parents[1]
DEFAULT_DB = REPO / "data" / "hr_health_check.db"

_local = threading.local()


def db_path() -> Path:
    override = os.environ.get("HRHC_DB")
    return Path(override) if override else DEFAULT_DB


def _connect() -> sqlite3.Connection:
    path = db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def get_conn() -> sqlite3.Connection:
    conn = getattr(_local, "conn", None)
    if conn is None:
        conn = _connect()
        _local.conn = conn
    return conn


@contextmanager
def transaction() -> Iterator[sqlite3.Connection]:
    conn = get_conn()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def init_db() -> None:
    with transaction() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS admins (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              email TEXT NOT NULL UNIQUE,
              password_hash TEXT NOT NULL,
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS settings (
              key TEXT PRIMARY KEY,
              value TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS content_pack (
              id INTEGER PRIMARY KEY CHECK (id = 1),
              pack_json TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              note TEXT
            );

            CREATE TABLE IF NOT EXISTS submissions (
              id TEXT PRIMARY KEY,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              status TEXT NOT NULL,
              is_preview INTEGER NOT NULL DEFAULT 0,
              first_name TEXT,
              last_name TEXT,
              email TEXT,
              phone TEXT,
              company TEXT,
              profile_json TEXT,
              eligibility_json TEXT,
              answers_json TEXT,
              result_json TEXT,
              score REAL,
              position TEXT,
              alert_count INTEGER
            );

            CREATE INDEX IF NOT EXISTS idx_submissions_updated
              ON submissions(updated_at DESC);
            CREATE INDEX IF NOT EXISTS idx_submissions_status
              ON submissions(status);
            CREATE INDEX IF NOT EXISTS idx_submissions_email
              ON submissions(email);
            """
        )


def dumps(data: Any) -> str:
    return json.dumps(data, ensure_ascii=False)


def loads(raw: str | None, default: Any = None) -> Any:
    if not raw:
        return default
    return json.loads(raw)
