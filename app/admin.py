"""Admin portal: login, submissions, reports, content editing."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Form, HTTPException, Query, Request
from fastapi.responses import HTMLResponse, JSONResponse, PlainTextResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

import auth
import pack_store
import submissions as sub_store
from db import dumps, get_conn, loads, now_iso, transaction

templates = Jinja2Templates(directory=str(__import__("pathlib").Path(__file__).parent / "templates"))
router = APIRouter(prefix="/admin", tags=["admin"])


class QuestionUpdate(BaseModel):
    Question: str | None = None
    help: str | None = Field(default=None, alias="Optional help / interpretation")
    Weight: float | int | None = None
    critical: str | None = Field(default=None, alias="Critical flag")
    Category: str | None = None
    Domain: str | None = None
    Route: str | None = None

    class Config:
        populate_by_name = True


class AnswerUpdate(BaseModel):
    label: str | None = Field(default=None, alias="Customer-facing answer")
    help: str | None = Field(default=None, alias="Help choosing this answer")
    Meaning: str | None = None
    points: float | int | None = Field(default=None, alias="Scoring points")

    class Config:
        populate_by_name = True


class ReportCopyUpdate(BaseModel):
    interpretation: str | None = Field(default=None, alias="Customer-facing interpretation")
    next: str | None = Field(default=None, alias="What to do next")
    support: str | None = Field(default=None, alias="Optional support")
    limitation: str | None = Field(default=None, alias="Mandatory limitation / display rule")
    Band: str | None = None

    class Config:
        populate_by_name = True


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


def _ctx(request: Request, **extra: Any) -> dict[str, Any]:
    return {
        "request": request,
        "admin": auth.current_admin(request),
        "product_name": "HR Health Check",
        **extra,
    }


@router.get("", response_class=HTMLResponse)
@router.get("/", response_class=HTMLResponse)
async def admin_home(request: Request):
    if not auth.current_admin(request):
        return RedirectResponse("/admin/login", status_code=303)
    return RedirectResponse("/admin/dashboard", status_code=303)


@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if auth.current_admin(request):
        return RedirectResponse("/admin/dashboard", status_code=303)
    return templates.TemplateResponse(
        request, "admin/login.html", _ctx(request, error=None)
    )


@router.post("/login")
async def login_submit(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
):
    admin = auth.authenticate(email, password)
    if not admin:
        return templates.TemplateResponse(
            request,
            "admin/login.html",
            _ctx(request, error="Incorrect email or password"),
            status_code=401,
        )
    response = RedirectResponse("/admin/dashboard", status_code=303)
    auth.set_admin_cookie(response, admin["id"], admin["email"])
    return response


@router.post("/logout")
async def logout():
    response = RedirectResponse("/admin/login", status_code=303)
    auth.clear_admin_cookie(response)
    return response


@router.get("/dashboard", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    q: str | None = None,
    status: str | None = None,
    include_preview: int = 0,
):
    admin = auth.require_admin(request)
    items, total = sub_store.list_submissions(
        q=q,
        status=status or None,
        include_preview=bool(include_preview),
        limit=200,
    )
    return templates.TemplateResponse(
        request,
        "admin/dashboard.html",
        _ctx(
            request,
            admin=admin,
            items=items,
            total=total,
            stats=sub_store.stats(),
            q=q or "",
            status=status or "",
            include_preview=bool(include_preview),
            pack=pack_store.pack_meta(),
        ),
    )


@router.get("/submissions/{sid}", response_class=HTMLResponse)
async def submission_detail(request: Request, sid: str):
    admin = auth.require_admin(request)
    session = sub_store.get_submission(sid)
    if not session:
        raise HTTPException(404, "Submission not found")
    eligible_count = sum(
        1 for v in (session.get("eligibility") or {}).values() if int(v) == 1
    )
    return templates.TemplateResponse(
        request,
        "admin/submission.html",
        _ctx(
            request,
            admin=admin,
            session=session,
            eligible_count=eligible_count,
        ),
    )


@router.get("/submissions/{sid}/report.md")
async def download_report_md(request: Request, sid: str):
    auth.require_admin(request)
    session = sub_store.get_submission(sid)
    if not session or not session.get("result"):
        raise HTTPException(404, "Report not available")
    md = session["result"].get("markdown") or ""
    filename = f"hrhc-{sid[:8]}-report.md"
    return PlainTextResponse(
        md,
        media_type="text/markdown; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/submissions/{sid}/report.json")
async def download_report_json(request: Request, sid: str):
    auth.require_admin(request)
    session = sub_store.get_submission(sid)
    if not session or not session.get("result"):
        raise HTTPException(404, "Report not available")
    filename = f"hrhc-{sid[:8]}-report.json"
    return JSONResponse(
        session["result"],
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/api/submissions")
async def api_list_submissions(
    request: Request,
    q: str | None = None,
    status: str | None = None,
    include_preview: bool = False,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
):
    auth.require_admin(request)
    items, total = sub_store.list_submissions(
        q=q, status=status, include_preview=include_preview, limit=limit, offset=offset
    )
    return {"total": total, "items": items, "stats": sub_store.stats()}


@router.get("/content", response_class=HTMLResponse)
async def content_page(request: Request, qid: str | None = None):
    admin = auth.require_admin(request)
    pack = pack_store.get_pack()
    questions = pack.get("questions", [])
    selected = None
    answers: list[dict[str, Any]] = []
    if qid:
        selected = next((x for x in questions if x["Question ID"] == qid), None)
        if selected:
            answers = pack_store.answers_for_question(qid)
    report_copy = pack.get("report_copy", [])
    return templates.TemplateResponse(
        request,
        "admin/content.html",
        _ctx(
            request,
            admin=admin,
            questions=questions,
            selected=selected,
            answers=answers,
            report_copy=report_copy,
            pack=pack_store.pack_meta(),
            qid=qid or "",
        ),
    )


@router.put("/api/content/questions/{question_id}")
async def api_update_question(request: Request, question_id: str, body: dict[str, Any]):
    auth.require_admin(request)
    try:
        updated = pack_store.update_question(question_id, body)
    except KeyError:
        raise HTTPException(404, "Question not found") from None
    return {"ok": True, "question": updated, "pack": pack_store.pack_meta()}


@router.put("/api/content/answers/{question_id}/{code}")
async def api_update_answer(
    request: Request, question_id: str, code: str, body: dict[str, Any]
):
    auth.require_admin(request)
    try:
        updated = pack_store.update_answer(question_id, code, body)
    except KeyError:
        raise HTTPException(404, "Answer not found") from None
    return {"ok": True, "answer": updated, "pack": pack_store.pack_meta()}


@router.put("/api/content/report-copy/{index}")
async def api_update_report_copy(request: Request, index: int, body: dict[str, Any]):
    auth.require_admin(request)
    try:
        updated = pack_store.update_report_copy_row(index, body)
    except IndexError:
        raise HTTPException(404, "Report copy row not found") from None
    return {"ok": True, "row": updated, "pack": pack_store.pack_meta()}


@router.post("/api/content/reload-from-engine")
async def api_reload_pack(request: Request):
    auth.require_admin(request)
    pack_store.reload_from_engine_files()
    return {"ok": True, "pack": pack_store.pack_meta()}


@router.get("/api/content/export")
async def api_export_pack(request: Request):
    auth.require_admin(request)
    pack = pack_store.get_pack()
    return JSONResponse(
        pack,
        headers={
            "Content-Disposition": 'attachment; filename="hrhc-content-pack.json"'
        },
    )


@router.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    admin = auth.require_admin(request)
    conn = get_conn()
    rows = conn.execute("SELECT key, value FROM settings ORDER BY key").fetchall()
    settings: dict[str, Any] = {}
    for r in rows:
        value = loads(r["value"], r["value"])
        settings[r["key"]] = value
    defaults = {
        "product_name": "HR Health Check",
        "support_email": "info@dreamstonehr.com.au",
        "support_phone": "(02) 8320 9320",
        "privacy_url": "https://www.dreamstonehr.com.au",
    }
    for key, value in defaults.items():
        settings.setdefault(key, value)
    return templates.TemplateResponse(
        request,
        "admin/settings.html",
        _ctx(request, admin=admin, settings=settings, pack=pack_store.pack_meta()),
    )


@router.post("/api/settings/password")
async def api_change_password(request: Request, body: PasswordChange):
    admin = auth.require_admin(request)
    row = get_conn().execute(
        "SELECT password_hash FROM admins WHERE id = ?", (admin["id"],)
    ).fetchone()
    if not row or not auth.verify_password(body.current_password, row["password_hash"]):
        raise HTTPException(400, "Current password is incorrect")
    auth.update_admin_password(admin["id"], body.new_password)
    return {"ok": True}


@router.post("/api/settings")
async def api_update_settings(request: Request, body: dict[str, Any]):
    auth.require_admin(request)
    allowed = {"product_name", "support_email", "support_phone", "privacy_url"}
    with transaction() as conn:
        for key, value in body.items():
            if key not in allowed:
                continue
            conn.execute(
                """
                INSERT INTO settings (key, value) VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, dumps(value)),
            )
    return {"ok": True, "updated_at": now_iso()}
