"""Assemble Client Preview–style report output from AssessmentResult."""

from __future__ import annotations

import json
from typing import Any

from score import AssessmentResult, BAND_DEVELOPING, BAND_ESTABLISHED, BAND_FOUNDATIONS


def _pct(value: float | None, digits: int = 1) -> str:
    if value is None:
        return "—"
    return f"{value:.{digits}f}"


def render_markdown(result: AssessmentResult) -> str:
    lines: list[str] = []
    lines.append("# Your HR priorities")
    lines.append("")
    lines.append(
        "Ratings reflect reported practices and context, not an independent audit "
        "or a finding that the business has breached the law."
    )
    lines.append("")
    lines.append("## Overall")
    lines.append("")
    lines.append(f"- **Overall position:** {result.overall_position}")
    if result.published_score is not None:
        lines.append(
            f"- **Reported-practice score:** {_pct(result.published_score)} / 100. "
            "This is not a compliance percentage."
        )
    else:
        lines.append(
            "- **Reported-practice score:** Not published "
            "(incomplete, not assessed, or uncertainty above threshold)."
        )
        if result.overall_score is not None:
            lines.append(f"- **Working score (unpublished):** {_pct(result.overall_score)} / 100")
    lines.append(
        f"- **Risk and action alerts:** {result.critical_count} Critical; "
        f"{result.high_priority_count} High-priority."
    )
    if result.unknown_share_overall is not None:
        lines.append(
            f"- **Unknown information:** {_pct(result.unknown_share_overall * 100)}% "
            "of the domain-weighted assessment is not yet confirmed."
        )
    lines.append("")

    if result.alerts:
        lines.append("## Critical and High-priority alerts")
        lines.append("")
        for i, alert in enumerate(result.alerts, 1):
            lines.append(f"{i}. **{alert['title']}** (`{alert['question_id']}`)")
        lines.append("")

    if result.workstreams:
        lines.append("## Start with these workstreams")
        lines.append("")
        for i, ws in enumerate(result.workstreams, 1):
            lines.append(f"### Workstream {i}: {ws['lead_finding']}")
            lines.append("")
            lines.append(f"- **Risk / priority:** {ws['risk_priority']}")
            lines.append(f"- **Why it matters:** {ws['why_it_matters']}")
            lines.append(f"- **Do first:** {ws['do_first']}")
            if ws.get("then"):
                lines.append(f"- **Then:** {ws['then']}")
            if ws.get("verify"):
                lines.append(f"- **Verify:** {ws['verify']}")
            lines.append(f"- **Who owns it:** {ws.get('owner') or '—'}")
            lines.append(f"- **When to act:** {ws.get('when_to_act') or '—'}")
            lines.append(f"- **Finished means:** {ws.get('finished_means') or '—'}")
            lines.append(f"- **You reported:** {ws.get('you_reported') or '—'}")
            lines.append("")

    lines.append("## Category scores")
    lines.append("")
    lines.append("| Category | Score | Position |")
    lines.append("|---|---:|---|")
    for d in result.domains:
        score = _pct(d.score_pct) if d.score_pct is not None else "—"
        lines.append(f"| {d.name} | {score} | {d.display} |")
    lines.append("")

    lines.append("## Category interpretation")
    lines.append("")
    for d in result.domains:
        if d.score_pct is None:
            continue
        copy = getattr(d, "report_copy", None)
        if not copy:
            continue
        lines.append(f"### {d.name} — {copy.get('Band')}")
        lines.append("")
        lines.append(str(copy.get("Customer-facing interpretation") or ""))
        lines.append("")
        nxt = copy.get("What to do next")
        if nxt:
            lines.append(f"**What to do next:** {nxt}")
            lines.append("")

    return "\n".join(lines).rstrip() + "\n"


def result_to_dict(result: AssessmentResult) -> dict[str, Any]:
    return {
        "overall_position": result.overall_position,
        "overall_score": result.overall_score,
        "published_score": result.published_score,
        "unknown_share_overall": result.unknown_share_overall,
        "critical_count": result.critical_count,
        "high_priority_count": result.high_priority_count,
        "incomplete": result.incomplete,
        "domains": [
            {
                "code": d.code,
                "name": d.name,
                "weight_pct": d.weight_pct,
                "score_pct": d.score_pct,
                "display": d.display,
                "unknown_share": d.unknown_share,
                "high_critical_known": d.high_critical_known,
                "high_priority_unknown": d.high_priority_unknown,
                "report_copy": getattr(d, "report_copy", None),
            }
            for d in result.domains
        ],
        "alerts": result.alerts,
        "workstreams": result.workstreams,
        "questions": [
            {
                "question_id": q.question_id,
                "domain": q.domain,
                "eligible": q.eligible,
                "response": q.response,
                "points_earned": q.points_earned,
                "risk_rank": q.risk_rank,
                "priority_rank": q.priority_rank,
            }
            for q in result.questions
            if q.eligible
        ],
    }


def render_json(result: AssessmentResult) -> str:
    return json.dumps(result_to_dict(result), indent=2, default=str)
