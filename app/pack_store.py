"""Owned content pack: loaded from SQLite, seeded from engine/data/pack.json."""

from __future__ import annotations

import copy
import json
import threading
from pathlib import Path
from typing import Any

from db import dumps, get_conn, init_db, loads, now_iso, transaction

REPO = Path(__file__).resolve().parents[1]
ENGINE_PACK = REPO / "engine" / "data" / "pack.json"

_lock = threading.RLock()
_cache: dict[str, Any] | None = None


def seed_pack_if_needed() -> None:
    init_db()
    conn = get_conn()
    row = conn.execute("SELECT id FROM content_pack WHERE id = 1").fetchone()
    if row:
        return
    if not ENGINE_PACK.exists():
        raise FileNotFoundError(f"Missing seed pack at {ENGINE_PACK}")
    pack = json.loads(ENGINE_PACK.read_text(encoding="utf-8"))
    save_pack(pack, note="Seeded from engine/data/pack.json")


def get_pack(*, refresh: bool = False) -> dict[str, Any]:
    global _cache
    with _lock:
        if _cache is not None and not refresh:
            return _cache
        seed_pack_if_needed()
        row = get_conn().execute(
            "SELECT pack_json FROM content_pack WHERE id = 1"
        ).fetchone()
        if not row:
            raise RuntimeError("Content pack missing after seed")
        _cache = loads(row["pack_json"], {})
        return _cache


def save_pack(pack: dict[str, Any], note: str = "") -> dict[str, Any]:
    global _cache
    with _lock:
        with transaction() as conn:
            conn.execute(
                """
                INSERT INTO content_pack (id, pack_json, updated_at, note)
                VALUES (1, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                  pack_json = excluded.pack_json,
                  updated_at = excluded.updated_at,
                  note = excluded.note
                """,
                (dumps(pack), now_iso(), note),
            )
        _cache = pack
        return pack


def pack_meta() -> dict[str, Any]:
    seed_pack_if_needed()
    row = get_conn().execute(
        "SELECT updated_at, note FROM content_pack WHERE id = 1"
    ).fetchone()
    pack = get_pack()
    return {
        "updated_at": row["updated_at"] if row else None,
        "note": row["note"] if row else None,
        "version": pack.get("version"),
        "source": pack.get("source"),
        "questions": len(pack.get("questions", [])),
        "answers": len(pack.get("answers", [])),
        "domains": len(pack.get("domains", [])),
        "report_copy_rows": len(pack.get("report_copy", [])),
    }


def reload_from_engine_files(note: str = "Reloaded from engine/data") -> dict[str, Any]:
    pack = json.loads(ENGINE_PACK.read_text(encoding="utf-8"))
    return save_pack(pack, note=note)


def update_question(question_id: str, fields: dict[str, Any]) -> dict[str, Any]:
    pack = copy.deepcopy(get_pack())
    found = None
    for q in pack["questions"]:
        if q["Question ID"] == question_id:
            found = q
            break
    if not found:
        raise KeyError(question_id)
    allowed = {
        "Question",
        "Optional help / interpretation",
        "Weight",
        "Critical flag",
        "Category",
        "Domain",
        "Route",
    }
    for key, value in fields.items():
        if key in allowed:
            found[key] = value
    save_pack(pack, note=f"Updated question {question_id}")
    return found


def update_answer(question_id: str, code: str, fields: dict[str, Any]) -> dict[str, Any]:
    pack = copy.deepcopy(get_pack())
    found = None
    for a in pack["answers"]:
        if a["Question ID"] == question_id and str(a["Response code"]) == str(code):
            found = a
            break
    if not found:
        raise KeyError(f"{question_id}:{code}")
    allowed = {
        "Customer-facing answer",
        "Help choosing this answer",
        "Meaning",
        "Scoring points",
    }
    for key, value in fields.items():
        if key in allowed:
            found[key] = value
    save_pack(pack, note=f"Updated answer {question_id}/{code}")
    return found


def update_report_copy_row(index: int, fields: dict[str, Any]) -> dict[str, Any]:
    pack = copy.deepcopy(get_pack())
    rows = pack.get("report_copy") or []
    if index < 0 or index >= len(rows):
        raise IndexError(index)
    allowed = {
        "Customer-facing interpretation",
        "What to do next",
        "Optional support",
        "Mandatory limitation / display rule",
        "Band",
    }
    for key, value in fields.items():
        if key in allowed:
            rows[index][key] = value
    save_pack(pack, note=f"Updated report_copy[{index}]")
    return rows[index]


def answers_for_question(question_id: str) -> list[dict[str, Any]]:
    pack = get_pack()
    out = [a for a in pack["answers"] if a["Question ID"] == question_id]
    order = {"0": 0, "1": 1, "2": 2, "3": 3, "DK": 4}
    out.sort(key=lambda a: order.get(str(a["Response code"]), 99))
    return out
