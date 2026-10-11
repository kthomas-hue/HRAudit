"""HR Health Check v3 scoring engine.

Implements the Score Sandbox / Scoring sheet arithmetic from the
DreamStoneHR Risk and Action Build Pack v3.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


RISK_LABELS = {
    0: "Unverified",
    1: "Low",
    2: "Medium",
    3: "High",
    4: "Critical",
}

BAND_FOUNDATIONS = "Foundations need attention"
BAND_DEVELOPING = "Developing / inconsistent"
BAND_ESTABLISHED = "Established reported practice"
POS_PRIORITY = "Priority review required"
POS_IMMEDIATE = "Immediate action required"
POS_CONFIRM = "Information needs confirmation"
POS_INCOMPLETE = "Incomplete"
POS_NOT_ASSESSED = "Not assessed"


@dataclass
class QuestionResult:
    question_id: str
    domain: str
    category: str
    weight: float
    critical: bool
    eligible: bool
    response: str | int | None
    points_earned: float
    eligible_weight: float
    unknown_weight: float
    outcome: dict[str, Any] | None = None
    action: dict[str, Any] | None = None
    risk_rank: int = 0
    priority_rank: int = 0


@dataclass
class DomainResult:
    code: str
    name: str
    weight_pct: float
    eligible_q_weight: float
    weighted_points: float
    score_pct: float | None
    unknown_q_weight: float
    unknown_share: float | None
    high_critical_known: int
    high_priority_unknown: int
    display: str
    eligible_for_overall: bool = False


@dataclass
class AssessmentResult:
    domains: list[DomainResult]
    questions: list[QuestionResult]
    overall_score: float | None
    published_score: float | None
    overall_position: str
    unknown_share_overall: float | None
    critical_count: int
    high_priority_count: int
    alerts: list[dict[str, Any]] = field(default_factory=list)
    workstreams: list[dict[str, Any]] = field(default_factory=list)
    incomplete: bool = False
    params: dict[str, Any] = field(default_factory=dict)


def _norm_response(value: Any) -> str | None:
    if value is None or value == "":
        return None
    if isinstance(value, float) and value.is_integer():
        value = int(value)
    s = str(value).strip()
    if s.upper() == "DK":
        return "DK"
    if s in {"0", "1", "2", "3"}:
        return s
    raise ValueError(f"Invalid response {value!r}; expected 0,1,2,3 or DK")


def _band(score: float | None, lower: float, upper: float) -> str:
    if score is None:
        return POS_NOT_ASSESSED
    if score < lower:
        return BAND_FOUNDATIONS
    if score < upper:
        return BAND_DEVELOPING
    return BAND_ESTABLISHED


def _index_pack(pack: dict[str, Any]) -> dict[str, Any]:
    questions = {q["Question ID"]: q for q in pack["questions"]}
    answers_by_q: dict[str, dict[str, dict]] = {}
    for a in pack["answers"]:
        answers_by_q.setdefault(a["Question ID"], {})[str(a["Response code"])] = a
    outcomes = {o["Outcome ID"]: o for o in pack["outcomes"]}
    actions = {a["Question ID"]: a for a in pack["actions"]}
    domains = {d["code"]: d for d in pack["domains"]}
    report_copy = {}
    for row in pack.get("report_copy") or []:
        report_copy[(row["Category"], row["Band"])] = row
    return {
        "questions": questions,
        "answers_by_q": answers_by_q,
        "outcomes": outcomes,
        "actions": actions,
        "domains": domains,
        "report_copy": report_copy,
        "params": pack["params"],
    }


def score_assessment(
    pack: dict[str, Any],
    responses: dict[str, Any],
    eligibility: dict[str, Any] | None = None,
) -> AssessmentResult:
    """Score an assessment.

    responses: {question_id: 0|1|2|3|'DK'}
    eligibility: {question_id: 1|0}; default 1 for Route=ALL, 0 for others unless provided
    """
    idx = _index_pack(pack)
    params = idx["params"]
    max_pts = float(params["max_answer_points"])
    lower = float(params["lower_band"])
    upper = float(params["upper_band"])
    uncertainty = float(params["uncertainty_threshold"])

    q_results: list[QuestionResult] = []
    incomplete = False

    for qid, q in idx["questions"].items():
        route = (q.get("Route") or "ALL").strip()
        if eligibility is not None and qid in eligibility:
            eligible = int(eligibility[qid]) == 1
        else:
            # Default: core ALL questions eligible; conditional excluded until routed
            eligible = route == "ALL"

        raw = responses.get(qid)
        response = _norm_response(raw) if raw is not None and raw != "" else None

        weight = float(q["Weight"])
        critical = str(q.get("Critical flag", "")).strip().lower() == "yes"
        domain = q["Domain"]
        category = q["Category"]

        eligible_weight = weight if eligible else 0.0
        points = 0.0
        unknown_weight = 0.0
        outcome = None
        risk_rank = 0
        priority_rank = 0

        if eligible:
            if response is None:
                incomplete = True
            elif response == "DK":
                unknown_weight = weight
                points = 0.0
            else:
                points = weight * int(response)

            if response is not None:
                oid = f"{qid}_{response}"
                outcome = idx["outcomes"].get(oid)
                if outcome:
                    risk_rank = int(outcome.get("Base risk rank") or 0)
                    priority_rank = int(outcome.get("Base priority rank") or 0)

        q_results.append(
            QuestionResult(
                question_id=qid,
                domain=domain,
                category=category,
                weight=weight,
                critical=critical,
                eligible=eligible,
                response=response,
                points_earned=points,
                eligible_weight=eligible_weight,
                unknown_weight=unknown_weight,
                outcome=outcome,
                action=idx["actions"].get(qid),
                risk_rank=risk_rank,
                priority_rank=priority_rank,
            )
        )

    # Domain aggregation
    domain_results: list[DomainResult] = []
    by_domain: dict[str, list[QuestionResult]] = {}
    for qr in q_results:
        by_domain.setdefault(qr.domain, []).append(qr)

    for code, meta in idx["domains"].items():
        items = by_domain.get(code, [])
        elig_w = sum(i.eligible_weight for i in items)
        pts = sum(i.points_earned for i in items)
        unk_w = sum(i.unknown_weight for i in items)
        score = (pts / (elig_w * max_pts) * 100.0) if elig_w > 0 else None
        unk_share = (unk_w / elig_w) if elig_w > 0 else None
        high_known = sum(
            1
            for i in items
            if i.eligible and i.response not in (None, "DK") and i.priority_rank >= 3
        )
        high_unk = sum(
            1 for i in items if i.eligible and i.response == "DK" and i.priority_rank >= 3
        )
        domain_incomplete = any(
            i.eligible and i.response is None for i in items
        )

        if domain_incomplete:
            display = POS_INCOMPLETE
        elif elig_w == 0:
            display = POS_NOT_ASSESSED
        elif unk_share is not None and unk_share > uncertainty:
            display = POS_CONFIRM
        elif high_known + high_unk > 0:
            display = POS_PRIORITY
        else:
            display = _band(score, lower, upper)

        domain_results.append(
            DomainResult(
                code=code,
                name=meta["name"],
                weight_pct=float(meta["weight_pct"]),
                eligible_q_weight=elig_w,
                weighted_points=pts,
                score_pct=score,
                unknown_q_weight=unk_w,
                unknown_share=unk_share,
                high_critical_known=high_known,
                high_priority_unknown=high_unk,
                display=display,
                eligible_for_overall=elig_w > 0,
            )
        )

    # Overall score = weighted average of domain scores by domain weight
    weight_sum = 0.0
    weighted_score_sum = 0.0
    unk_weight_sum = 0.0
    for d in domain_results:
        if not d.eligible_for_overall or d.score_pct is None:
            continue
        weight_sum += d.weight_pct
        weighted_score_sum += d.score_pct * d.weight_pct
        unk_weight_sum += (d.unknown_share or 0.0) * d.weight_pct

    overall = (weighted_score_sum / weight_sum) if weight_sum else None
    unk_overall = (unk_weight_sum / weight_sum) if weight_sum else None

    critical_count = sum(
        1 for q in q_results if q.eligible and q.risk_rank >= 4
    )
    # High-priority actions: priority_rank >= 3 (includes High and Critical priority)
    high_priority_qs = [
        q
        for q in q_results
        if q.eligible and q.response is not None and q.priority_rank >= 3
    ]
    high_priority_count = len(high_priority_qs)

    if incomplete or weight_sum == 0:
        position = POS_INCOMPLETE if incomplete else POS_NOT_ASSESSED
    elif critical_count > 0:
        position = POS_IMMEDIATE
    elif unk_overall is not None and unk_overall > uncertainty:
        position = POS_CONFIRM
    elif high_priority_count > 0:
        position = POS_PRIORITY
    else:
        position = _band(overall, lower, upper)

    # Published score blank when incomplete / not assessed / uncertainty exceeded
    publish_blocked = (
        incomplete
        or weight_sum == 0
        or (unk_overall is not None and unk_overall > uncertainty)
        or abs(sum(d.weight_pct for d in domain_results) - 100) > 0.01
    )
    published = None if publish_blocked else overall

    # Alerts sorted by priority then risk
    alerts = []
    for q in sorted(
        high_priority_qs,
        key=lambda x: (-x.priority_rank, -x.risk_rank, x.question_id),
    ):
        o = q.outcome or {}
        a = q.action or {}
        risk_label = RISK_LABELS.get(q.risk_rank, str(q.risk_rank))
        pri_label = RISK_LABELS.get(q.priority_rank, str(q.priority_rank))
        headline = o.get("Finding headline") or a.get("Finding headline") or q.question_id
        if q.response == "DK" and not str(headline).lower().startswith("verify"):
            title = f"{pri_label} priority | {risk_label} risk | Verify: {headline}"
        else:
            title = f"{pri_label} priority | {risk_label} risk | {headline}"
        alerts.append(
            {
                "question_id": q.question_id,
                "domain": q.domain,
                "category": q.category,
                "response": q.response,
                "selected_response": o.get("Selected response"),
                "title": title,
                "headline": headline,
                "risk_rank": q.risk_rank,
                "priority_rank": q.priority_rank,
                "risk_label": risk_label,
                "priority_label": pri_label,
                "why_it_matters": o.get("Why it matters") or a.get("Why it matters"),
                "first_action": o.get("First action") or a.get("Practical first step"),
                "then_implement": o.get("Then implement"),
                "then_verify": o.get("Then verify"),
                "owner": a.get("Suggested owner"),
                "timing": a.get("Suggested timing") or o.get("Timing rule"),
                "completion_evidence": a.get("Evidence of completion")
                or o.get("Completion evidence"),
                "action_family": (a or {}).get("Action family"),
                "recheck": (a or {}).get("Recheck trigger") or o.get("Recheck trigger"),
            }
        )

    # Top 3 workstreams from alerts (distinct action families when possible)
    workstreams = []
    seen_families: set[str] = set()
    for alert in alerts:
        fam = alert.get("action_family") or alert["question_id"]
        if fam in seen_families and len(workstreams) >= 1:
            # still allow if we need to fill to 3 unique questions
            related = sum(1 for a in alerts if (a.get("action_family") or a["question_id"]) == fam)
            # skip duplicate family leads
            if any(w.get("action_family") == fam for w in workstreams):
                continue
        seen_families.add(fam)
        workstreams.append(
            {
                "lead_finding": alert["headline"],
                "question_id": alert["question_id"],
                "action_family": fam,
                "risk_priority": (
                    f"{alert['risk_label']} provisional risk; "
                    f"{alert['priority_label']} action priority. Basis: Self-report only"
                ),
                "why_it_matters": alert["why_it_matters"],
                "do_first": alert["first_action"],
                "then": alert["then_implement"],
                "verify": alert["then_verify"],
                "owner": alert["owner"],
                "when_to_act": alert["timing"],
                "finished_means": alert["completion_evidence"],
                "you_reported": alert["selected_response"],
                "check_again": alert["recheck"],
                "related_findings": (
                    f"{fam}: "
                    f"{sum(1 for a in alerts if (a.get('action_family') or a['question_id']) == fam)}"
                    f" active item(s) in this family."
                ),
            }
        )
        if len(workstreams) >= 3:
            break

    # Attach category report copy
    for d in domain_results:
        band = _band(d.score_pct, lower, upper) if d.score_pct is not None else None
        # When priority overrides display, still keep score band for interpretation copy
        copy_band = band
        if copy_band:
            d_copy = idx["report_copy"].get((d.name, copy_band))  # type: ignore[attr-defined]
            # stash on object dynamically
            setattr(d, "report_copy", d_copy)

    return AssessmentResult(
        domains=domain_results,
        questions=q_results,
        overall_score=overall,
        published_score=published,
        overall_position=position,
        unknown_share_overall=unk_overall,
        critical_count=critical_count,
        high_priority_count=high_priority_count,
        alerts=alerts,
        workstreams=workstreams,
        incomplete=incomplete,
        params=params,
    )


def responses_from_sandbox(pack: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
    """Load the fictional Score Sandbox demonstration inputs."""
    responses: dict[str, Any] = {}
    eligibility: dict[str, Any] = {}
    for row in pack["sandbox_demo"]:
        qid = row["question_id"]
        eligibility[qid] = row["eligible"]
        responses[qid] = row["response"]
    return responses, eligibility


def all_response(
    pack: dict[str, Any],
    value: Any,
    *,
    core_only: bool = True,
) -> tuple[dict[str, Any], dict[str, Any]]:
    responses: dict[str, Any] = {}
    eligibility: dict[str, Any] = {}
    for q in pack["questions"]:
        qid = q["Question ID"]
        is_core = (q.get("Route") or "ALL") == "ALL"
        if core_only:
            eligibility[qid] = 1 if is_core else 0
            if is_core:
                responses[qid] = value
        else:
            eligibility[qid] = 1
            responses[qid] = value
    return responses, eligibility
