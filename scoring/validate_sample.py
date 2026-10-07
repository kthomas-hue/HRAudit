#!/usr/bin/env python3
"""Replay the sample HR Health Check submission against the exported scoring model.

Validates that category % and overall % match HR Health Checkresults.pdf
(as captured from assessment #17307 on Agolix).

Usage:
  python3 scoring/validate_sample.py
"""

from __future__ import annotations

import json
import re
import sys
from collections import defaultdict
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent
QUESTIONS_PATH = ROOT / "questions.json"

TYPE_NAMES = {
    31326: "Pay & Entitlements",
    31327: "Employment Contracts",
    31328: "Recruitment & Talent",
    31329: "New Hires & Onboarding",
    31330: "Policies & Procedures",
    31331: "Workplace Health & Safety",
    31332: "Reviewing & Managing Performance",
    31333: "Training & Development",
    31334: "Culture & Engagement",
    31335: "Record Keeping",
    31336: "Employee Exits",
}

# Expected from HR Health Checkresults.pdf (30/09/2026 sample)
EXPECTED = {
    "Pay & Entitlements": 53,
    "Employment Contracts": 6,
    "Recruitment & Talent": 36,
    "New Hires & Onboarding": 24,
    "Policies & Procedures": 51,
    "Workplace Health & Safety": 43,
    "Reviewing & Managing Performance": 63,
    "Training & Development": 12,
    "Culture & Engagement": 78,
    "Record Keeping": 65,
    "Employee Exits": 46,
    "Overall": 47,
}

# Psychosocial appears on results at 0% but has no type_based_id / type_assignments
# in the public question payload — documented as a market blocker.
PSYCHOSOCIAL_ALWAYS_ZERO = True


def strip_html(s: str | None) -> str:
    if not s:
        return ""
    return unescape(re.sub(r"<[^>]+>", "", s)).replace("\xa0", " ").strip()


def find_opt(by_id: dict, qid: int, substr: str) -> int:
    for o in by_id[qid]["options"]:
        if substr.lower() in strip_html(o["option"]).lower():
            return o["id"]
    raise KeyError(f"option not found q={qid} substr={substr!r}")


def sample_answers(by_id: dict) -> dict:
    """Answers from the sample results PDF Q&A pages."""
    a = {
        261768: 5,
        261769: 9,
        261770: 7,
        261771: 223928,
        261772: 223931,
        261775: 223935,
        261776: 4,
        261777: 223938,
        261779: [223943],
        261780: "No",
        261781: 9,
        261782: [223952],
        261783: "No",
        261784: [223958],
        261786: "No",
        261787: "No",
        261788: "Yes",
        261789: "Yes",
        261790: 8,
        261795: "No",
        261796: "No",
        261797: "No",
        261799: 9,
        261800: 9,
        261801: 7,
        261802: "No",
        261804: "No",
        261805: 6,
        261807: "No",
        261808: 5,
        261809: 6,
        261810: "No",
        261812: "Yes",
        261815: "Yes",
        261816: 8,
        261818: "No",
        261819: 8,
        261820: "No",
        261822: "No",
        261823: "No",
        261824: "Yes",
        261827: "Yes",
        261829: 9,
        261831: "No",
        261832: 9,
        261834: 4,
        261835: "No",
        261836: 7,
        261837: 7,
        261838: 7,
        261840: "No",
        261842: 7,
        261843: 6,
        261847: 7,
        261848: 6,
        261850: "No",
        261851: 7,
    }
    a[261791] = find_opt(by_id, 261791, "tell staff what they would be paid")
    a[261794] = find_opt(by_id, 261794, "hours but not their breaks")
    a[261798] = find_opt(by_id, 261798, "sign / approve all deductions")
    a[261803] = [find_opt(by_id, 261803, "Bullying")]
    a[261817] = find_opt(by_id, 261817, "do not have a good understanding")
    a[261845] = [find_opt(by_id, 261845, "when they first commence")]
    a[261846] = [find_opt(by_id, 261846, "RUOK")]
    return a


def score(questions: list, answers: dict) -> tuple[dict, dict]:
    earned: dict[int, float] = defaultdict(float)
    maximum: dict[int, float] = defaultdict(float)

    for item in questions:
        if item["type"] == "narrative":
            continue
        ans = answers.get(item["id"])
        if ans is None:
            continue

        tids: set[int] = set()
        if item["type"] in ("scale", "binary"):
            tids.add(item["type_based_id"])
        for o in item.get("options") or []:
            for ta in o.get("type_assignments") or []:
                tids.add(ta["type_id"])

        for tid in tids:
            if item["type"] == "scale":
                mx = float(item.get("right_value") or 10) if item["type_based_id"] == tid else 0.0
                e = float(ans) if item["type_based_id"] == tid else 0.0
            elif item["type"] == "binary":
                if item["type_based_id"] != tid:
                    mx, e = 0.0, 0.0
                else:
                    left = float(item.get("left_value") or 0)
                    right = float(item.get("right_value") or 0)
                    mx = max(left, right)
                    e = left if ans == "Yes" else right
            elif item["type"] == "option":
                vals = [
                    float(ta["value"])
                    for o in item["options"]
                    for ta in (o.get("type_assignments") or [])
                    if ta["type_id"] == tid
                ]
                if not vals:
                    continue
                mx = sum(vals) if item.get("select_multiple") else max(vals)
                selected = ans if isinstance(ans, list) else [ans]
                e = 0.0
                for oid in selected:
                    opt = next(x for x in item["options"] if x["id"] == oid)
                    for ta in opt.get("type_assignments") or []:
                        if ta["type_id"] == tid:
                            e += float(ta["value"])
            else:
                continue

            if mx == 0 and e == 0:
                continue
            earned[tid] += e
            maximum[tid] += mx

    return earned, maximum


def main() -> int:
    questions = json.loads(QUESTIONS_PATH.read_text())
    by_id = {q["id"]: q for q in questions}
    answers = sample_answers(by_id)
    earned, maximum = score(questions, answers)

    print("HR Health Check — sample score validation\n")
    failures = 0
    for tid, name in sorted(TYPE_NAMES.items()):
        e, m = earned[tid], maximum[tid]
        pct = round(100 * e / m) if m else 0
        exp = EXPECTED[name]
        ok = pct == exp
        if not ok:
            failures += 1
        flag = "OK" if ok else f"FAIL expected {exp}"
        print(f"  {name}: {pct}% ({e:.0f}/{m:.0f}) [{flag}]")

    te, tm = sum(earned.values()), sum(maximum.values())
    overall = round(100 * te / tm) if tm else 0
    ok = overall == EXPECTED["Overall"]
    if not ok:
        failures += 1
    print(
        f"  Overall Score: {overall}% ({te:.0f}/{tm:.0f}) "
        f"[{'OK' if ok else f'FAIL expected {EXPECTED['Overall']}'}]"
    )

    print()
    market_blockers = 0
    if PSYCHOSOCIAL_ALWAYS_ZERO:
        market_blockers += 1
        print(
            "  MARKET BLOCKER: Psychosocial Risk & Positive Duty has no scored questions "
            "in questions.json — live results always show 0% and the low-band PDF section."
        )

    required = sum(1 for q in questions if q.get("required"))
    if required == 0:
        market_blockers += 1
        print("  MARKET BLOCKER: 0/65 questions are required.")

    pay = sum(1 for q in questions if q.get("type_based_id") == 31326)
    print(f"  NOTE: {pay} questions have type_based_id=Pay & Entitlements (31326).")

    training_parents = [
        q
        for q in questions
        if any(
            ta.get("type_id") == 31333
            for o in (q.get("options") or [])
            for ta in (o.get("type_assignments") or [])
        )
    ]
    print(f"  NOTE: Training & Development is fed by {len(training_parents)} question(s).")

    print()
    if failures:
        print(f"FAILED — {failures} score check(s) did not match the golden PDF.")
        return 1
    print("PASSED — sample category + overall scores match the golden PDF.")
    if market_blockers:
        print(
            f"Market readiness: NOT READY ({market_blockers} blocker(s)). "
            "See docs/MARKET_READINESS_REVIEW.md"
        )
        return 0
    print("Market readiness structural checks clear.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
