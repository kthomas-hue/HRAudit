#!/usr/bin/env python3
"""DreamStoneHR HR Health Check — owned product (assessment + admin)."""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import BaseModel, Field

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent
ENGINE = REPO / "engine"
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ENGINE))

from report import render_markdown, result_to_dict  # noqa: E402
from score import responses_from_sandbox, score_assessment  # noqa: E402

import auth  # noqa: E402
import pack_store  # noqa: E402
import submissions as sub_store  # noqa: E402
from admin import router as admin_router  # noqa: E402
from db import init_db  # noqa: E402

try:
    from .routing import (  # noqa: E402
        eligibility_for_questions,
        resolve_routes,
        visible_questions,
    )
except ImportError:
    from routing import (  # noqa: E402
        eligibility_for_questions,
        resolve_routes,
        visible_questions,
    )


def bootstrap() -> None:
    """Create DB, default admin, and seed content pack if needed."""
    init_db()
    auth.ensure_default_admin()
    pack_store.seed_pack_if_needed()


@asynccontextmanager
async def lifespan(_: FastAPI):
    bootstrap()
    yield


# Eager bootstrap so tests / one-off imports have a ready database.
bootstrap()

app = FastAPI(
    title="DreamStoneHR Health Check",
    version="4.0",
    lifespan=lifespan,
)
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")
templates = Jinja2Templates(directory=str(ROOT / "templates"))
app.include_router(admin_router)


class ContactIn(BaseModel):
    first_name: str = ""
    last_name: str = ""
    email: str = ""
    phone: str = ""
    company: str = ""


class ProfileIn(BaseModel):
    arrangements: list[str] = Field(default_factory=list)
    pay_rules: list[str] = Field(default_factory=list)
    specific: list[str] = Field(default_factory=list)
    work: list[str] = Field(default_factory=list)
    managers: str | None = None
    ai_tools: str | None = None
    after_hours: str | None = None
    change: str | None = None
    wgea: str | None = None
    live_matter: str | None = None
    priorities: list[str] = Field(default_factory=list)
    targeted: dict[str, str] = Field(default_factory=dict)
    headcount_band: str | None = None
    states: list[str] = Field(default_factory=list)


class AnswerIn(BaseModel):
    question_id: str
    response: str


class SubmitIn(BaseModel):
    answers: dict[str, str]


def _pack() -> dict[str, Any]:
    return pack_store.get_pack()


def _answers_by_question(pack: dict[str, Any]) -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for a in pack["answers"]:
        out.setdefault(a["Question ID"], []).append(
            {
                "code": str(a["Response code"]),
                "label": a["Customer-facing answer"],
                "help": a.get("Help choosing this answer"),
                "points": a.get("Scoring points"),
            }
        )
    order = {"0": 0, "1": 1, "2": 2, "3": 3, "DK": 4}
    for qid in out:
        out[qid].sort(key=lambda x: order.get(x["code"], 99))
    return out


def _public_question(q: dict[str, Any], answers_by_q: dict[str, list]) -> dict[str, Any]:
    return {
        "id": q["Question ID"],
        "domain": q["Domain"],
        "category": q["Category"],
        "question": q["Question"],
        "help": q.get("Optional help / interpretation"),
        "weight": q["Weight"],
        "critical": str(q.get("Critical flag", "")).lower() == "yes",
        "route": q.get("Route"),
        "answers": answers_by_q.get(q["Question ID"], []),
    }


def _require_session(sid: str) -> dict[str, Any]:
    session = sub_store.get_submission(sid)
    if not session:
        raise HTTPException(404, "Session not found")
    return session


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/session")
async def create_session(contact: ContactIn):
    sid = sub_store.create_submission(contact.model_dump())
    return {"session_id": sid}


@app.post("/api/session/{sid}/profile")
async def save_profile(sid: str, profile: ProfileIn):
    _require_session(sid)
    pack = _pack()
    data = profile.model_dump()
    routes = resolve_routes(data)
    eligibility = eligibility_for_questions(pack["questions"], routes)
    sub_store.save_profile(sid, data, eligibility)
    answers_by_q = _answers_by_question(pack)
    visible = visible_questions(pack["questions"], eligibility)
    groups: dict[str, list] = {}
    for q in visible:
        groups.setdefault(q["Category"], []).append(_public_question(q, answers_by_q))
    return {
        "routes": routes,
        "eligible_count": sum(eligibility.values()),
        "live_matter": data.get("live_matter"),
        "categories": [
            {"name": name, "questions": qs} for name, qs in groups.items()
        ],
    }


@app.get("/api/session/{sid}/questions")
async def get_questions(sid: str):
    session = _require_session(sid)
    if not session.get("eligibility"):
        raise HTTPException(400, "Profile not saved")
    pack = _pack()
    answers_by_q = _answers_by_question(pack)
    visible = visible_questions(pack["questions"], session["eligibility"])
    groups: dict[str, list] = {}
    for q in visible:
        groups.setdefault(q["Category"], []).append(_public_question(q, answers_by_q))
    return {
        "eligible_count": len(visible),
        "answered_count": len(session["answers"]),
        "categories": [
            {"name": name, "questions": qs} for name, qs in groups.items()
        ],
        "answers": session["answers"],
        "live_matter": (session.get("profile") or {}).get("live_matter"),
    }


@app.put("/api/session/{sid}/answer")
async def save_answer(sid: str, body: AnswerIn):
    session = _require_session(sid)
    if body.response not in {"0", "1", "2", "3", "DK"}:
        raise HTTPException(400, "Response must be 0,1,2,3 or DK")
    if session["eligibility"].get(body.question_id, 0) != 1:
        raise HTTPException(400, "Question not eligible for this profile")
    answers = sub_store.save_answer(sid, body.question_id, body.response)
    return {"ok": True, "answered_count": len(answers)}


@app.post("/api/session/{sid}/submit")
async def submit(sid: str, body: SubmitIn | None = None):
    session = _require_session(sid)
    answers = dict(session["answers"] or {})
    if body and body.answers:
        for qid, resp in body.answers.items():
            if resp in {"0", "1", "2", "3", "DK"} and session["eligibility"].get(qid) == 1:
                answers[qid] = resp
        sub_store.save_answers(sid, answers)

    missing = [
        qid
        for qid, elig in session["eligibility"].items()
        if elig == 1 and qid not in answers
    ]
    if missing:
        raise HTTPException(
            400,
            detail={
                "message": "Please answer all eligible questions before submitting.",
                "missing": missing[:20],
                "missing_count": len(missing),
            },
        )

    pack = _pack()
    result = score_assessment(pack, answers, session["eligibility"])
    payload = result_to_dict(result)
    payload["markdown"] = render_markdown(result)
    payload["contact"] = session["contact"]
    payload["live_matter"] = (session.get("profile") or {}).get("live_matter")
    sub_store.save_result(sid, payload, is_preview=False)
    return payload


@app.get("/api/session/{sid}/result")
async def get_result(sid: str):
    session = _require_session(sid)
    if not session.get("result"):
        raise HTTPException(400, "Assessment not submitted")
    return session["result"]


@app.get("/api/health")
async def health():
    pack = _pack()
    return {
        "ok": True,
        "product": "owned",
        "questions": len(pack["questions"]),
        "domains": len(pack["domains"]),
        "pack": pack_store.pack_meta(),
        "stats": sub_store.stats(),
    }


@app.post("/api/preview/sandbox")
async def client_preview_sandbox():
    """Load the pack Score Sandbox demo and return a Client Preview report."""
    pack = _pack()
    responses, eligibility = responses_from_sandbox(pack)
    answers = {qid: str(resp) for qid, resp in responses.items() if eligibility.get(qid) == 1}
    elig_int = {qid: int(v) for qid, v in eligibility.items()}

    contact = {
        "first_name": "Sandbox",
        "last_name": "Demo",
        "email": "preview@dreamstonehr.example",
        "phone": "",
        "company": "Client Preview Co",
    }
    sid = sub_store.create_submission(contact, is_preview=True)
    sub_store.save_profile(sid, {"live_matter": "no"}, elig_int)
    sub_store.save_answers(sid, answers)

    result = score_assessment(pack, answers, elig_int)
    payload = result_to_dict(result)
    payload["markdown"] = render_markdown(result)
    payload["contact"] = contact
    payload["live_matter"] = "no"
    payload["preview"] = True
    payload["preview_label"] = "Client Preview · Score Sandbox demo (fictional inputs)"
    sub_store.save_result(sid, payload, is_preview=True)

    answers_by_q = _answers_by_question(pack)
    visible = visible_questions(pack["questions"], elig_int)
    groups: dict[str, list] = {}
    for q in visible:
        groups.setdefault(q["Category"], []).append(_public_question(q, answers_by_q))

    return {
        "session_id": sid,
        "eligible_count": sum(elig_int.values()),
        "categories": [
            {"name": name, "questions": qs} for name, qs in groups.items()
        ],
        "answers": answers,
        "result": payload,
    }
