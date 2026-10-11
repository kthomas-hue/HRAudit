#!/usr/bin/env python3
"""DreamStoneHR Health Check assessment UI (v3 engine)."""

from __future__ import annotations

import json
import sys
import uuid
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

try:
    from .routing import (  # noqa: E402
        eligibility_for_questions,
        resolve_routes,
        visible_questions,
    )
except ImportError:  # running as script / tests with app/ on sys.path
    from routing import (  # noqa: E402
        eligibility_for_questions,
        resolve_routes,
        visible_questions,
    )

PACK = json.loads((ENGINE / "data" / "pack.json").read_text())
SESSIONS: dict[str, dict[str, Any]] = {}

app = FastAPI(title="DreamStoneHR Health Check", version="3.0")
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")
templates = Jinja2Templates(directory=str(ROOT / "templates"))


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
    response: str  # 0,1,2,3,DK


class SubmitIn(BaseModel):
    answers: dict[str, str]


def _answers_by_question() -> dict[str, list[dict[str, Any]]]:
    out: dict[str, list[dict[str, Any]]] = {}
    for a in PACK["answers"]:
        out.setdefault(a["Question ID"], []).append(
            {
                "code": str(a["Response code"]),
                "label": a["Customer-facing answer"],
                "help": a.get("Help choosing this answer"),
                "points": a.get("Scoring points"),
            }
        )
    # stable order 0,1,2,3,DK
    order = {"0": 0, "1": 1, "2": 2, "3": 3, "DK": 4}
    for qid in out:
        out[qid].sort(key=lambda x: order.get(x["code"], 99))
    return out


ANSWERS_BY_Q = _answers_by_question()


def _public_question(q: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": q["Question ID"],
        "domain": q["Domain"],
        "category": q["Category"],
        "question": q["Question"],
        "help": q.get("Optional help / interpretation"),
        "weight": q["Weight"],
        "critical": str(q.get("Critical flag", "")).lower() == "yes",
        "route": q.get("Route"),
        "answers": ANSWERS_BY_Q.get(q["Question ID"], []),
    }


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    # Starlette 1.x: TemplateResponse(request, name, context)
    return templates.TemplateResponse(request, "index.html")


@app.post("/api/session")
async def create_session(contact: ContactIn):
    sid = uuid.uuid4().hex
    SESSIONS[sid] = {
        "contact": contact.model_dump(),
        "profile": {},
        "routes": {},
        "eligibility": {},
        "answers": {},
        "result": None,
    }
    return {"session_id": sid}


@app.post("/api/session/{sid}/profile")
async def save_profile(sid: str, profile: ProfileIn):
    session = SESSIONS.get(sid)
    if not session:
        raise HTTPException(404, "Session not found")
    data = profile.model_dump()
    routes = resolve_routes(data)
    eligibility = eligibility_for_questions(PACK["questions"], routes)
    session["profile"] = data
    session["routes"] = routes
    session["eligibility"] = eligibility
    visible = visible_questions(PACK["questions"], eligibility)
    # group by category for UI
    groups: dict[str, list] = {}
    for q in visible:
        groups.setdefault(q["Category"], []).append(_public_question(q))
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
    session = SESSIONS.get(sid)
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.get("eligibility"):
        raise HTTPException(400, "Profile not saved")
    visible = visible_questions(PACK["questions"], session["eligibility"])
    groups: dict[str, list] = {}
    for q in visible:
        groups.setdefault(q["Category"], []).append(_public_question(q))
    return {
        "eligible_count": len(visible),
        "answered_count": len(session["answers"]),
        "categories": [
            {"name": name, "questions": qs} for name, qs in groups.items()
        ],
        "answers": session["answers"],
        "live_matter": session["profile"].get("live_matter"),
    }


@app.put("/api/session/{sid}/answer")
async def save_answer(sid: str, body: AnswerIn):
    session = SESSIONS.get(sid)
    if not session:
        raise HTTPException(404, "Session not found")
    if body.response not in {"0", "1", "2", "3", "DK"}:
        raise HTTPException(400, "Response must be 0,1,2,3 or DK")
    if session["eligibility"].get(body.question_id, 0) != 1:
        raise HTTPException(400, "Question not eligible for this profile")
    session["answers"][body.question_id] = body.response
    return {"ok": True, "answered_count": len(session["answers"])}


@app.post("/api/session/{sid}/submit")
async def submit(sid: str, body: SubmitIn | None = None):
    session = SESSIONS.get(sid)
    if not session:
        raise HTTPException(404, "Session not found")
    if body and body.answers:
        for qid, resp in body.answers.items():
            if resp in {"0", "1", "2", "3", "DK"} and session["eligibility"].get(qid) == 1:
                session["answers"][qid] = resp

    # Ensure all eligible answered
    missing = [
        qid
        for qid, elig in session["eligibility"].items()
        if elig == 1 and qid not in session["answers"]
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

    result = score_assessment(PACK, session["answers"], session["eligibility"])
    payload = result_to_dict(result)
    payload["markdown"] = render_markdown(result)
    payload["contact"] = session["contact"]
    payload["live_matter"] = session["profile"].get("live_matter")
    session["result"] = payload
    return payload


@app.get("/api/session/{sid}/result")
async def get_result(sid: str):
    session = SESSIONS.get(sid)
    if not session:
        raise HTTPException(404, "Session not found")
    if not session.get("result"):
        raise HTTPException(400, "Assessment not submitted")
    return session["result"]


@app.get("/api/health")
async def health():
    return {
        "ok": True,
        "questions": len(PACK["questions"]),
        "domains": len(PACK["domains"]),
    }


@app.post("/api/preview/sandbox")
async def client_preview_sandbox():
    """Load the pack Score Sandbox demo and return a Client Preview report."""
    responses, eligibility = responses_from_sandbox(PACK)
    # Normalise response codes to strings for the UI
    answers = {qid: str(resp) for qid, resp in responses.items() if eligibility.get(qid) == 1}
    elig_int = {qid: int(v) for qid, v in eligibility.items()}

    sid = uuid.uuid4().hex
    result = score_assessment(PACK, answers, elig_int)
    payload = result_to_dict(result)
    payload["markdown"] = render_markdown(result)
    payload["contact"] = {
        "first_name": "Sandbox",
        "last_name": "Demo",
        "email": "preview@dreamstonehr.example",
        "company": "Client Preview Co",
    }
    payload["live_matter"] = "no"
    payload["preview"] = True
    payload["preview_label"] = "Client Preview · Score Sandbox demo (fictional inputs)"

    visible = visible_questions(PACK["questions"], elig_int)
    groups: dict[str, list] = {}
    for q in visible:
        groups.setdefault(q["Category"], []).append(_public_question(q))

    SESSIONS[sid] = {
        "contact": payload["contact"],
        "profile": {"live_matter": "no"},
        "routes": {},
        "eligibility": elig_int,
        "answers": answers,
        "result": payload,
        "preview": True,
    }
    return {
        "session_id": sid,
        "eligible_count": sum(elig_int.values()),
        "categories": [
            {"name": name, "questions": qs} for name, qs in groups.items()
        ],
        "answers": answers,
        "result": payload,
    }
