#!/usr/bin/env python3
"""Validate scoring engine against pack sandbox + reference scenarios."""

from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from score import all_response, responses_from_sandbox, score_assessment  # noqa: E402


class EngineTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pack = json.loads((ROOT / "data" / "pack.json").read_text())

    def test_domain_weights_sum_100(self):
        total = sum(d["weight_pct"] for d in self.pack["domains"])
        self.assertEqual(total, 100)

    def test_every_question_has_five_answers_and_outcomes(self):
        answers = {}
        for a in self.pack["answers"]:
            answers.setdefault(a["Question ID"], set()).add(str(a["Response code"]))
        outcomes = {o["Outcome ID"] for o in self.pack["outcomes"]}
        for q in self.pack["questions"]:
            qid = q["Question ID"]
            self.assertEqual(answers[qid], {"0", "1", "2", "3", "DK"})
            for code in ("0", "1", "2", "3", "DK"):
                self.assertIn(f"{qid}_{code}", outcomes)

    def test_sandbox_demo_matches_pack_preview(self):
        responses, eligibility = responses_from_sandbox(self.pack)
        result = score_assessment(self.pack, responses, eligibility)

        self.assertAlmostEqual(result.overall_score, 91.02334267040149, places=4)
        self.assertAlmostEqual(result.published_score, 91.02334267040149, places=4)
        self.assertEqual(result.overall_position, "Priority review required")
        self.assertEqual(result.critical_count, 0)
        self.assertEqual(result.high_priority_count, 4)
        self.assertAlmostEqual(result.unknown_share_overall, 0.031764705882352945, places=5)

        by_code = {d.code: d for d in result.domains}
        self.assertAlmostEqual(by_code["PAY"].score_pct, 70.58823529411765, places=4)
        self.assertEqual(by_code["PAY"].display, "Priority review required")
        self.assertAlmostEqual(by_code["PSY"].score_pct, 78.57142857142857, places=4)
        self.assertEqual(by_code["CON"].score_pct, 100.0)
        self.assertEqual(by_code["CON"].display, "Established reported practice")

        alert_ids = {a["question_id"] for a in result.alerts}
        self.assertEqual(alert_ids, {"PAY02", "PAY04", "LND03", "PSY04"})

    def test_all_established_core(self):
        responses, eligibility = all_response(self.pack, 3, core_only=True)
        result = score_assessment(self.pack, responses, eligibility)
        self.assertEqual(result.overall_score, 100.0)
        self.assertEqual(result.published_score, 100.0)
        self.assertEqual(result.high_priority_count, 0)
        self.assertEqual(result.overall_position, "Established reported practice")

    def test_all_absent_core(self):
        responses, eligibility = all_response(self.pack, 0, core_only=True)
        result = score_assessment(self.pack, responses, eligibility)
        self.assertEqual(result.overall_score, 0.0)
        self.assertEqual(result.published_score, 0.0)
        self.assertGreater(result.high_priority_count, 0)
        self.assertIn(
            result.overall_position,
            {"Priority review required", "Immediate action required", "Foundations need attention"},
        )

    def test_all_unknown_core_blocks_publication(self):
        responses, eligibility = all_response(self.pack, "DK", core_only=True)
        result = score_assessment(self.pack, responses, eligibility)
        self.assertEqual(result.overall_score, 0.0)
        self.assertIsNone(result.published_score)
        self.assertEqual(result.overall_position, "Information needs confirmation")
        self.assertGreater(result.unknown_share_overall, 0.25)

    def test_incomplete_blocks_publication(self):
        responses, eligibility = all_response(self.pack, 3, core_only=True)
        # Leave one core unanswered
        core = next(q["Question ID"] for q in self.pack["questions"] if q["Route"] == "ALL")
        del responses[core]
        result = score_assessment(self.pack, responses, eligibility)
        self.assertTrue(result.incomplete)
        self.assertIsNone(result.published_score)
        self.assertEqual(result.overall_position, "Incomplete")

    def test_psychosocial_moves_with_answers(self):
        responses, eligibility = all_response(self.pack, 3, core_only=True)
        # Drop psychosocial to zeros
        for qid in ("PSY01", "PSY02", "PSY03", "PSY04", "PSY05"):
            responses[qid] = 0
        result = score_assessment(self.pack, responses, eligibility)
        psy = next(d for d in result.domains if d.code == "PSY")
        self.assertEqual(psy.score_pct, 0.0)
        self.assertEqual(psy.display, "Priority review required")
        self.assertTrue(any(a["question_id"].startswith("PSY") for a in result.alerts))


if __name__ == "__main__":
    unittest.main()
