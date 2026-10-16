"""Submission / assessment session persistence."""

from __future__ import annotations

import uuid
from typing import Any

from db import dumps, get_conn, loads, now_iso, transaction


def create_submission(contact: dict[str, Any], *, is_preview: bool = False) -> str:
    sid = uuid.uuid4().hex
    ts = now_iso()
    status = "preview" if is_preview else "in_progress"
    with transaction() as conn:
        conn.execute(
            """
            INSERT INTO submissions (
              id, created_at, updated_at, status, is_preview,
              first_name, last_name, email, phone, company,
              profile_json, eligibility_json, answers_json, result_json,
              score, position, alert_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                sid,
                ts,
                ts,
                status,
                1 if is_preview else 0,
                contact.get("first_name") or "",
                contact.get("last_name") or "",
                contact.get("email") or "",
                contact.get("phone") or "",
                contact.get("company") or "",
                dumps({}),
                dumps({}),
                dumps({}),
                None,
                None,
                None,
                None,
            ),
        )
    return sid


def get_submission(sid: str) -> dict[str, Any] | None:
    row = get_conn().execute(
        "SELECT * FROM submissions WHERE id = ?", (sid,)
    ).fetchone()
    if not row:
        return None
    return _row_to_session(row)


def _row_to_session(row: Any) -> dict[str, Any]:
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
        "status": row["status"],
        "is_preview": bool(row["is_preview"]),
        "contact": {
            "first_name": row["first_name"] or "",
            "last_name": row["last_name"] or "",
            "email": row["email"] or "",
            "phone": row["phone"] or "",
            "company": row["company"] or "",
        },
        "profile": loads(row["profile_json"], {}),
        "eligibility": loads(row["eligibility_json"], {}),
        "answers": loads(row["answers_json"], {}),
        "result": loads(row["result_json"], None),
        "score": row["score"],
        "position": row["position"],
        "alert_count": row["alert_count"],
    }


def update_submission(sid: str, **fields: Any) -> None:
    allowed = {
        "status",
        "is_preview",
        "first_name",
        "last_name",
        "email",
        "phone",
        "company",
        "profile_json",
        "eligibility_json",
        "answers_json",
        "result_json",
        "score",
        "position",
        "alert_count",
    }
    cols = []
    vals: list[Any] = []
    for key, value in fields.items():
        if key not in allowed:
            continue
        cols.append(f"{key} = ?")
        vals.append(value)
    if not cols:
        return
    cols.append("updated_at = ?")
    vals.append(now_iso())
    vals.append(sid)
    with transaction() as conn:
        cur = conn.execute(
            f"UPDATE submissions SET {', '.join(cols)} WHERE id = ?",
            vals,
        )
        if cur.rowcount == 0:
            raise KeyError(sid)


def save_profile(sid: str, profile: dict[str, Any], eligibility: dict[str, int]) -> None:
    update_submission(
        sid,
        profile_json=dumps(profile),
        eligibility_json=dumps(eligibility),
        status="in_progress",
    )


def save_answer(sid: str, question_id: str, response: str) -> dict[str, Any]:
    session = get_submission(sid)
    if not session:
        raise KeyError(sid)
    answers = dict(session["answers"] or {})
    answers[question_id] = response
    update_submission(sid, answers_json=dumps(answers))
    return answers


def save_answers(sid: str, answers: dict[str, str]) -> None:
    update_submission(sid, answers_json=dumps(answers))


def save_result(sid: str, result: dict[str, Any], *, is_preview: bool = False) -> None:
    alerts = result.get("alerts") or []
    update_submission(
        sid,
        result_json=dumps(result),
        status="preview" if is_preview else "completed",
        is_preview=1 if is_preview else 0,
        score=result.get("published_score"),
        position=result.get("overall_position") or result.get("position"),
        alert_count=len(alerts) if isinstance(alerts, list) else None,
        first_name=(result.get("contact") or {}).get("first_name"),
        last_name=(result.get("contact") or {}).get("last_name"),
        email=(result.get("contact") or {}).get("email"),
        company=(result.get("contact") or {}).get("company"),
    )


def list_submissions(
    *,
    q: str | None = None,
    status: str | None = None,
    include_preview: bool = False,
    limit: int = 100,
    offset: int = 0,
) -> tuple[list[dict[str, Any]], int]:
    clauses = []
    params: list[Any] = []
    if not include_preview:
        clauses.append("is_preview = 0")
    if status:
        clauses.append("status = ?")
        params.append(status)
    if q:
        clauses.append(
            "(company LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)"
        )
        like = f"%{q.strip()}%"
        params.extend([like, like, like, like])
    where = f"WHERE {' AND '.join(clauses)}" if clauses else ""
    conn = get_conn()
    total = conn.execute(
        f"SELECT COUNT(*) AS n FROM submissions {where}", params
    ).fetchone()["n"]
    rows = conn.execute(
        f"""
        SELECT id, created_at, updated_at, status, is_preview,
               first_name, last_name, email, phone, company,
               score, position, alert_count
        FROM submissions
        {where}
        ORDER BY updated_at DESC
        LIMIT ? OFFSET ?
        """,
        [*params, limit, offset],
    ).fetchall()
    items = [
        {
            "id": r["id"],
            "created_at": r["created_at"],
            "updated_at": r["updated_at"],
            "status": r["status"],
            "is_preview": bool(r["is_preview"]),
            "first_name": r["first_name"] or "",
            "last_name": r["last_name"] or "",
            "email": r["email"] or "",
            "phone": r["phone"] or "",
            "company": r["company"] or "",
            "score": r["score"],
            "position": r["position"],
            "alert_count": r["alert_count"],
        }
        for r in rows
    ]
    return items, int(total)


def stats() -> dict[str, Any]:
    conn = get_conn()
    row = conn.execute(
        """
        SELECT
          SUM(CASE WHEN is_preview = 0 THEN 1 ELSE 0 END) AS total,
          SUM(CASE WHEN status = 'completed' AND is_preview = 0 THEN 1 ELSE 0 END) AS completed,
          SUM(CASE WHEN status = 'in_progress' AND is_preview = 0 THEN 1 ELSE 0 END) AS in_progress,
          SUM(CASE WHEN is_preview = 1 THEN 1 ELSE 0 END) AS previews
        FROM submissions
        """
    ).fetchone()
    return {
        "total": int(row["total"] or 0),
        "completed": int(row["completed"] or 0),
        "in_progress": int(row["in_progress"] or 0),
        "previews": int(row["previews"] or 0),
    }
