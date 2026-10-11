#!/usr/bin/env python3
"""CLI for the HR Health Check v3 scoring engine."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from report import render_json, render_markdown  # noqa: E402
from score import all_response, responses_from_sandbox, score_assessment  # noqa: E402


def load_pack(path: Path | None = None) -> dict:
    pack_path = path or (ROOT / "data" / "pack.json")
    return json.loads(pack_path.read_text())


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Score an HR Health Check v3 assessment")
    parser.add_argument(
        "--scenario",
        choices=["sandbox", "all3", "all0", "all_dk", "custom"],
        default="sandbox",
        help="Built-in scenario (default: sandbox demo from the pack)",
    )
    parser.add_argument(
        "--responses",
        type=Path,
        help="JSON file of {question_id: response} for --scenario custom",
    )
    parser.add_argument(
        "--eligibility",
        type=Path,
        help="Optional JSON file of {question_id: 0|1}",
    )
    parser.add_argument(
        "--format",
        choices=["markdown", "json", "both"],
        default="markdown",
    )
    parser.add_argument(
        "--out",
        type=Path,
        help="Write output to this path (markdown or json). For both, use stem.",
    )
    parser.add_argument("--pack", type=Path, help="Path to pack.json")
    args = parser.parse_args(argv)

    pack = load_pack(args.pack)

    if args.scenario == "sandbox":
        responses, eligibility = responses_from_sandbox(pack)
    elif args.scenario == "all3":
        responses, eligibility = all_response(pack, 3, core_only=True)
    elif args.scenario == "all0":
        responses, eligibility = all_response(pack, 0, core_only=True)
    elif args.scenario == "all_dk":
        responses, eligibility = all_response(pack, "DK", core_only=True)
    else:
        if not args.responses:
            parser.error("--responses is required for custom scenario")
        responses = json.loads(args.responses.read_text())
        eligibility = (
            json.loads(args.eligibility.read_text()) if args.eligibility else None
        )

    result = score_assessment(pack, responses, eligibility)

    md = render_markdown(result)
    js = render_json(result)

    if args.format in ("markdown", "both"):
        if args.out:
            out = args.out if args.format == "markdown" else args.out.with_suffix(".md")
            out.write_text(md)
            print(f"Wrote {out}", file=sys.stderr)
        else:
            print(md)
    if args.format in ("json", "both"):
        if args.out:
            out = args.out if args.format == "json" else args.out.with_suffix(".json")
            out.write_text(js)
            print(f"Wrote {out}", file=sys.stderr)
        elif args.format == "json":
            print(js)

    # Summary line for automation
    print(
        f"[summary] position={result.overall_position} "
        f"published={result.published_score!r} "
        f"working={result.overall_score!r} "
        f"critical={result.critical_count} high={result.high_priority_count}",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
