"""Map unscored profile answers to conditional question eligibility."""

from __future__ import annotations

from typing import Any

# Route flag → show conditional questions with that Route value
# Profile unknown/"need to confirm" keeps the route ON (never silent N/A).

ARRANGEMENT_FLAGS = {
    "part_time": "PART_TIME",
    "casual": "CASUAL",
    "fixed": "FIXED",
    "contractor": "CONTRACTOR",
    "junior": "JUNIOR",
}

PAY_FLAGS = {
    "awards": "ALLOWANCE",  # award coverage keeps allowance checks
    "enterprise_agreement": "AGREEMENT",
    "salary_flat_rate": "SALARY",
    "allowances": "ALLOWANCE",
}

SPECIFIC_FLAGS = {
    "deductions": "DEDUCTION",
    "shutdown": "SHUTDOWN",
    "cashout": "CASHOUT",
    "ifa": "IFA",
}

WORK_FLAGS = {
    "credentials": "CREDENTIAL",
    "remote": "REMOTE",
    "portable": "PORTABLE",
}

TARGETED_FLAGS = {
    "pay_error": "PAY_ERROR",
    "adjustment": "ADJUSTMENT",
    "shared_work": "SHARED_WORK",
}


def _tri_state_on(value: Any) -> bool:
    """Enable follow-ups for yes / unsure / need_to_confirm only.

    Missing answers do not enable routes — the profile UI should collect them.
    Confirmed 'no' never enables. Unknown is never treated as confirmed no.
    """
    if value is None or value == "":
        return False
    s = str(value).strip().lower()
    if s in {"no", "false", "0", "none", "confirmed_no"}:
        return False
    return True  # yes / unsure / need_to_confirm


def resolve_routes(profile: dict[str, Any]) -> dict[str, bool]:
    """Return route_flag → enabled."""
    routes: dict[str, bool] = {flag: False for flag in {
        "PART_TIME", "CASUAL", "FIXED", "CONTRACTOR", "JUNIOR",
        "SALARY", "ALLOWANCE", "AGREEMENT",
        "DEDUCTION", "SHUTDOWN", "CASHOUT", "IFA",
        "PORTABLE", "CREDENTIAL", "REMOTE",
        "AI", "AFTER_HOURS", "WGEA", "REDUNDANCY", "MANAGERS",
        "CHANGE", "PAY_ERROR", "ADJUSTMENT", "SHARED_WORK",
    }}

    arrangements = set(profile.get("arrangements") or [])
    if "need_to_confirm" in arrangements or "unsure" in arrangements:
        for flag in ARRANGEMENT_FLAGS.values():
            routes[flag] = True
    elif "none" not in arrangements:
        for key, flag in ARRANGEMENT_FLAGS.items():
            if key in arrangements:
                routes[flag] = True

    pay = set(profile.get("pay_rules") or [])
    if "need_to_confirm" in pay:
        routes["SALARY"] = True
        routes["ALLOWANCE"] = True
        routes["AGREEMENT"] = True
    else:
        for key, flag in PAY_FLAGS.items():
            if key in pay:
                routes[flag] = True
        # Award coverage also enables allowance follow-up
        if "awards" in pay:
            routes["ALLOWANCE"] = True

    specific = set(profile.get("specific") or [])
    if "need_to_confirm" in specific:
        for flag in SPECIFIC_FLAGS.values():
            routes[flag] = True
    elif "none" not in specific:
        for key, flag in SPECIFIC_FLAGS.items():
            if key in specific:
                routes[flag] = True

    work = set(profile.get("work") or [])
    if "need_to_confirm" in work:
        for flag in WORK_FLAGS.values():
            routes[flag] = True
    else:
        for key, flag in WORK_FLAGS.items():
            if key in work:
                routes[flag] = True

    managers = profile.get("managers")
    if managers in {"several", "sites", "combination", "unsure", "need_to_confirm"}:
        routes["MANAGERS"] = True
    else:
        routes["MANAGERS"] = False

    routes["AI"] = _tri_state_on(profile.get("ai_tools"))
    routes["AFTER_HOURS"] = _tri_state_on(profile.get("after_hours"))

    change = profile.get("change")
    if change in {"change_no_job_loss", "unsure", "need_to_confirm"}:
        routes["CHANGE"] = True
    elif change == "redundancy":
        routes["CHANGE"] = True
        routes["REDUNDANCY"] = True
    else:
        routes["CHANGE"] = False
        routes["REDUNDANCY"] = False

    routes["WGEA"] = _tri_state_on(profile.get("wgea"))

    targeted = profile.get("targeted") or {}
    for key, flag in TARGETED_FLAGS.items():
        routes[flag] = _tri_state_on(targeted.get(key))
        if str(targeted.get(key, "")).lower() in {"no", "false", "0"}:
            routes[flag] = False

    # Immediate matter does not add score routes; UI shows a banner separately
    return routes


def eligibility_for_questions(
    questions: list[dict[str, Any]],
    routes: dict[str, bool],
) -> dict[str, int]:
    """question_id → 1 eligible / 0 excluded."""
    eligibility: dict[str, int] = {}
    for q in questions:
        qid = q["Question ID"]
        route = (q.get("Route") or "ALL").strip()
        if route == "ALL":
            eligibility[qid] = 1
        else:
            eligibility[qid] = 1 if routes.get(route, False) else 0
    return eligibility


def visible_questions(
    questions: list[dict[str, Any]],
    eligibility: dict[str, int],
) -> list[dict[str, Any]]:
    return [q for q in questions if eligibility.get(q["Question ID"], 0) == 1]
