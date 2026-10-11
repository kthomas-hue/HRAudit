#!/usr/bin/env python3
"""Smoke tests for the assessment API + routing."""

from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(REPO / "engine"))

from main import app  # noqa: E402
from routing import resolve_routes, eligibility_for_questions  # noqa: E402
import json

PACK = json.loads((REPO / "engine" / "data" / "pack.json").read_text())


class RoutingTests(unittest.TestCase):
    def test_core_always_eligible(self):
        routes = resolve_routes({"arrangements": ["none"], "change": "no_change", "ai_tools": "no", "after_hours": "no", "targeted": {"pay_error": "no", "adjustment": "no", "shared_work": "no"}})
        elig = eligibility_for_questions(PACK["questions"], routes)
        cores = [q for q in PACK["questions"] if q["Route"] == "ALL"]
        self.assertTrue(all(elig[q["Question ID"]] == 1 for q in cores))
        self.assertEqual(sum(elig.values()), 44)

    def test_casual_enables_followups(self):
        routes = resolve_routes({"arrangements": ["casual"]})
        self.assertTrue(routes["CASUAL"])
        elig = eligibility_for_questions(PACK["questions"], routes)
        self.assertEqual(elig["B02"], 1)
        self.assertEqual(elig["B03"], 1)

    def test_unknown_keeps_followups(self):
        routes = resolve_routes({"arrangements": ["need_to_confirm"]})
        self.assertTrue(routes["CASUAL"])
        self.assertTrue(routes["PART_TIME"])


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.json()["ok"])

    def test_full_flow_sandbox_like(self):
        r = self.client.post(
            "/api/session",
            json={
                "first_name": "Test",
                "last_name": "User",
                "email": "test@example.com",
                "company": "Demo Co",
            },
        )
        self.assertEqual(r.status_code, 200)
        sid = r.json()["session_id"]

        r = self.client.post(
            f"/api/session/{sid}/profile",
            json={
                "arrangements": ["none"],
                "pay_rules": [],
                "specific": ["none"],
                "work": [],
                "managers": "owner",
                "ai_tools": "no",
                "after_hours": "no",
                "change": "no_change",
                "live_matter": "no",
                "targeted": {
                    "pay_error": "no",
                    "adjustment": "no",
                    "shared_work": "no",
                },
            },
        )
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertEqual(body["eligible_count"], 44)
        self.assertGreaterEqual(len(body["categories"]), 10)

        # answer all visible as 3 except a couple of lows matching sandbox spirit
        answers = {}
        for cat in body["categories"]:
            for q in cat["questions"]:
                answers[q["id"]] = "3"
        answers["PAY02"] = "1"
        answers["PAY04"] = "DK"
        answers["LND03"] = "1"
        answers["PSY04"] = "0"

        for qid, resp in answers.items():
            r = self.client.put(
                f"/api/session/{sid}/answer",
                json={"question_id": qid, "response": resp},
            )
            self.assertEqual(r.status_code, 200, qid)

        r = self.client.post(f"/api/session/{sid}/submit", json={"answers": answers})
        self.assertEqual(r.status_code, 200)
        result = r.json()
        self.assertEqual(result["overall_position"], "Priority review required")
        self.assertAlmostEqual(result["published_score"], 91.02334267040149, places=2)
        self.assertEqual(result["high_priority_count"], 4)
        self.assertIn("markdown", result)

    def test_client_preview_sandbox(self):
        r = self.client.post("/api/preview/sandbox")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body["session_id"])
        self.assertGreater(body["eligible_count"], 40)
        self.assertTrue(body["result"]["preview"])
        # Pack Score Sandbox cached Client Preview numbers
        self.assertEqual(body["result"]["overall_position"], "Priority review required")
        self.assertAlmostEqual(body["result"]["published_score"], 91.02334267040149, places=2)
        self.assertEqual(body["result"]["high_priority_count"], 4)
        self.assertIn("markdown", body["result"])

    def test_home_renders(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("DreamStoneHR", r.text)
        self.assertIn("Client Preview", r.text)


if __name__ == "__main__":
    unittest.main()
