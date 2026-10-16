#!/usr/bin/env python3
"""Smoke tests for the owned assessment API, admin portal, and routing."""

from __future__ import annotations

import os
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPO = ROOT.parent
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(REPO / "engine"))

# Isolate each test run on a fresh SQLite file before importing the app.
_TMPDIR = tempfile.TemporaryDirectory(prefix="hrhc-test-")
os.environ["HRHC_DB"] = str(Path(_TMPDIR.name) / "test.db")
os.environ["HRHC_SECRET"] = "test-secret"
os.environ["ADMIN_EMAIL"] = "admin@dreamstonehr.com.au"
os.environ["ADMIN_PASSWORD"] = "dreamstone"

from fastapi.testclient import TestClient  # noqa: E402

from main import app  # noqa: E402
from routing import resolve_routes, eligibility_for_questions  # noqa: E402
import json  # noqa: E402
import pack_store  # noqa: E402

PACK = json.loads((REPO / "engine" / "data" / "pack.json").read_text())


class RoutingTests(unittest.TestCase):
    def test_core_always_eligible(self):
        routes = resolve_routes(
            {
                "arrangements": ["none"],
                "change": "no_change",
                "ai_tools": "no",
                "after_hours": "no",
                "targeted": {"pay_error": "no", "adjustment": "no", "shared_work": "no"},
            }
        )
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
        cls._cm = TestClient(app)
        cls.client = cls._cm.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._cm.__exit__(None, None, None)

    def test_health(self):
        r = self.client.get("/api/health")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body["ok"])
        self.assertEqual(body["product"], "owned")

    def test_full_flow_persists_submission(self):
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
        categories = r.json()["categories"]
        self.assertTrue(categories)

        answers = {}
        for cat in categories:
            for q in cat["questions"]:
                answers[q["id"]] = "3"

        for qid, resp in answers.items():
            r = self.client.put(
                f"/api/session/{sid}/answer",
                json={"question_id": qid, "response": resp},
            )
            self.assertEqual(r.status_code, 200, r.text)

        r = self.client.post(f"/api/session/{sid}/submit", json={"answers": answers})
        self.assertEqual(r.status_code, 200, r.text)
        result = r.json()
        self.assertIn("published_score", result)
        self.assertIn("markdown", result)

        # Restart client should still see persisted result via same DB file
        r = self.client.get(f"/api/session/{sid}/result")
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.json()["published_score"], result["published_score"])

    def test_client_preview_sandbox(self):
        r = self.client.post("/api/preview/sandbox")
        self.assertEqual(r.status_code, 200)
        body = r.json()
        self.assertTrue(body["session_id"])
        self.assertTrue(body["result"]["preview"])
        self.assertAlmostEqual(body["result"]["published_score"], 91.0, places=0)
        self.assertEqual(body["result"]["overall_position"], "Priority review required")
        self.assertEqual(body["result"]["high_priority_count"], 4)

    def test_home_renders(self):
        r = self.client.get("/")
        self.assertEqual(r.status_code, 200)
        self.assertIn("HR Health Check", r.text)
        self.assertIn("DreamStoneHR", r.text)


class AdminTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._cm = TestClient(app)
        cls.client = cls._cm.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._cm.__exit__(None, None, None)

    def _login(self):
        r = self.client.post(
            "/admin/login",
            data={"email": "admin@dreamstonehr.com.au", "password": "dreamstone"},
            follow_redirects=False,
        )
        self.assertIn(r.status_code, {303, 302}, r.text[:500])

    def test_admin_login_and_dashboard(self):
        self.client.cookies.clear()
        r = self.client.get("/admin/login")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Health Check admin", r.text)

        self._login()
        r = self.client.get("/admin/dashboard")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Submissions", r.text)
        self.assertIn("admin@dreamstonehr.com.au", r.text)

    def test_admin_sees_completed_submission_and_downloads(self):
        # Create a completed preview so admin has something to open
        r = self.client.post("/api/preview/sandbox")
        self.assertEqual(r.status_code, 200)
        sid = r.json()["session_id"]

        self._login()
        r = self.client.get("/admin/dashboard?include_preview=1")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Client Preview Co", r.text)
        r = self.client.get(f"/admin/submissions/{sid}")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Sandbox", r.text)
        self.assertIn("Download report", r.text)

        r = self.client.get(f"/admin/submissions/{sid}/report.md")
        self.assertEqual(r.status_code, 200)
        self.assertIn("Your HR priorities", r.text)

        r = self.client.get(f"/admin/submissions/{sid}/report.json")
        self.assertEqual(r.status_code, 200)
        self.assertIn("published_score", r.json())

    def test_admin_can_edit_question(self):
        self._login()
        pack = pack_store.get_pack()
        qid = pack["questions"][0]["Question ID"]
        original = pack["questions"][0]["Question"]
        new_text = original + " (admin edit test)"
        r = self.client.put(
            f"/admin/api/content/questions/{qid}",
            json={"Question": new_text},
        )
        self.assertEqual(r.status_code, 200, r.text)
        updated = pack_store.get_pack(refresh=True)
        found = next(q for q in updated["questions"] if q["Question ID"] == qid)
        self.assertEqual(found["Question"], new_text)
        # restore
        self.client.put(
            f"/admin/api/content/questions/{qid}",
            json={"Question": original},
        )

    def test_admin_api_requires_auth(self):
        # fresh client without cookie
        naked = TestClient(app)
        r = naked.get("/admin/api/submissions")
        self.assertEqual(r.status_code, 401)


if __name__ == "__main__":
    unittest.main()
