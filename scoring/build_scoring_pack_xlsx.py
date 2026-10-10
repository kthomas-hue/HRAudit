#!/usr/bin/env python3
"""Build a single editable Excel scoring pack from the live question export."""

from __future__ import annotations

import json
import re
from html import unescape
from pathlib import Path

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter
from openpyxl.worksheet.datavalidation import DataValidation

ROOT = Path(__file__).resolve().parent
QUESTIONS_PATH = ROOT / "questions.json"
OUT_PATH = ROOT.parent / "docs" / "scoring-pack" / "HR_Health_Check_Scoring_Pack.xlsx"

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

CATEGORIES = list(TYPE_NAMES.values()) + ["Psychosocial Risk & Positive Duty"]

HEADER_FILL = PatternFill("solid", fgColor="72246C")
HEADER_FONT = Font(color="FFFFFF", bold=True)
SECTION_FILL = PatternFill("solid", fgColor="F3EAF4")
NOTE_FILL = PatternFill("solid", fgColor="FFF8E7")
THIN = Border(
    left=Side(style="thin", color="D0D0D0"),
    right=Side(style="thin", color="D0D0D0"),
    top=Side(style="thin", color="D0D0D0"),
    bottom=Side(style="thin", color="D0D0D0"),
)
WRAP = Alignment(wrap_text=True, vertical="top")


def strip_html(s: str | None) -> str:
    if not s:
        return ""
    text = unescape(re.sub(r"<[^>]+>", "", s))
    return re.sub(r"\s+", " ", text.replace("\xa0", " ")).strip()


def style_header(ws, cols: int) -> None:
    for col in range(1, cols + 1):
        cell = ws.cell(1, col)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(wrap_text=True, vertical="center")
    ws.freeze_panes = "A2"
    ws.auto_filter.ref = ws.dimensions


def autosize(ws, widths: dict[int, int]) -> None:
    for col, width in widths.items():
        ws.column_dimensions[get_column_letter(col)].width = width


def add_category_validation(ws, col_letter: str, start_row: int, end_row: int) -> None:
    # Quote categories for Excel list validation
    joined = ",".join(CATEGORIES)
    dv = DataValidation(
        type="list",
        formula1=f'"{joined}"',
        allow_blank=True,
        showDropDown=False,
    )
    dv.error = "Pick a category from the list"
    dv.errorTitle = "Category"
    ws.add_data_validation(dv)
    dv.add(f"{col_letter}{start_row}:{col_letter}{end_row}")


def build_instructions(wb: Workbook) -> None:
    ws = wb.active
    ws.title = "Instructions"
    ws["A1"] = "DreamStoneHR — HR Health Check Scoring Pack"
    ws["A1"].font = Font(bold=True, size=16, color="72246C")
    lines = [
        "",
        "How to use this workbook",
        "1. Edit the Questions & Weights sheet — set/confirm Category and Points for every answer.",
        "2. Edit Band Thresholds if you want different Low / Medium / High cut-offs.",
        "3. Fill Report Wording for every Category × Band (36 blocks for 12 categories).",
        "4. Add new rows at the bottom of any sheet if you add questions or options.",
        "5. Send the updated file back — we will validate Low/Med/High paths and wire scoring.",
        "",
        "Sheet guide",
        "• Questions & Weights — one row per answer option (or per scale/binary endpoint).",
        "• Band Thresholds — % ranges that choose Low / Medium / High report text.",
        "• Report Wording — the PDF copy clients see for each band.",
        "• Categories — dropdown source list (don’t rename unless intentional).",
        "",
        "Tips",
        "• Prefer one category per question.",
        "• For “pick the best description” use single-select; for checklists use multi-select.",
        "• “Doesn’t apply to us” should usually score high (not zero), or it looks like failure.",
        "• Psychosocial Risk & Positive Duty currently has no wired questions — assign some or it stays 0%.",
        "• Yellow Notes column is for your comments (optional).",
        "",
        "Pre-filled values",
        "Questions & Weights start from the live Agolix assessment export. Current Category and Points",
        "reflect today’s scoring. Change them where the category should be different (especially Psychosocial).",
    ]
    for i, line in enumerate(lines, start=2):
        ws.cell(i, 1, line)
        if line.startswith("How to use") or line.startswith("Sheet guide") or line.startswith("Tips") or line.startswith("Pre-filled"):
            ws.cell(i, 1).font = Font(bold=True, color="72246C")
    ws.column_dimensions["A"].width = 110


def build_categories(wb: Workbook) -> None:
    ws = wb.create_sheet("Categories")
    ws.append(["Category"])
    style_header(ws, 1)
    for name in CATEGORIES:
        ws.append([name])
    autosize(ws, {1: 40})


def build_questions(wb: Workbook, questions: list) -> None:
    ws = wb.create_sheet("Questions & Weights")
    headers = [
        "Q_ID",
        "Agolix Question ID",
        "Agolix Option ID",
        "Question Type",
        "Select Multiple?",
        "Current Category (live)",
        "Category (edit this)",
        "Question",
        "Answer option",
        "Points (edit this)",
        "Left label / Yes",
        "Right label / No",
        "Notes",
    ]
    ws.append(headers)
    style_header(ws, len(headers))

    row_n = 1
    for ord_i, item in enumerate(questions, start=1):
        qid = f"Q{ord_i:02d}"
        qtext = strip_html(item.get("question"))
        qtype = item.get("type")
        multi = "Yes" if item.get("select_multiple") else "No"
        current_cat = TYPE_NAMES.get(item.get("type_based_id"), "")
        if qtype == "narrative":
            row_n += 1
            ws.append(
                [
                    qid,
                    item["id"],
                    "",
                    qtype,
                    multi,
                    current_cat,
                    "",  # no scoring
                    qtext,
                    "(optional feedback — do not score)",
                    0,
                    "",
                    "",
                    "Keep Points=0 / leave Category blank so it does not affect scores",
                ]
            )
            continue

        opts = item.get("options") or []
        if qtype in ("scale", "binary") and not opts:
            # One editable row representing the question; points = scale value or Yes weight
            if qtype == "binary":
                # Yes row
                row_n += 1
                ws.append(
                    [
                        qid,
                        item["id"],
                        "",
                        qtype,
                        multi,
                        current_cat,
                        current_cat,
                        qtext,
                        item.get("left_label") or "Yes",
                        item.get("left_value") if item.get("left_value") is not None else 1,
                        item.get("left_label") or "Yes",
                        item.get("right_label") or "No",
                        "Binary Yes points (No is usually 0 — add a No row if you want different)",
                    ]
                )
                row_n += 1
                ws.append(
                    [
                        qid,
                        item["id"],
                        "",
                        qtype,
                        multi,
                        current_cat,
                        current_cat,
                        qtext,
                        item.get("right_label") or "No",
                        item.get("right_value") if item.get("right_value") is not None else 0,
                        item.get("left_label") or "Yes",
                        item.get("right_label") or "No",
                        "",
                    ]
                )
            else:
                row_n += 1
                ws.append(
                    [
                        qid,
                        item["id"],
                        "",
                        qtype,
                        multi,
                        current_cat,
                        current_cat,
                        qtext,
                        f"Scale {item.get('left_value')}–{item.get('right_value')} (points = selected value)",
                        item.get("right_value") if item.get("right_value") is not None else 10,
                        item.get("left_label") or "",
                        item.get("right_label") or "",
                        "For scales, Points column = MAX points. Selected slider value = earned points.",
                    ]
                )
            continue

        # Option / multi-select questions
        for o in opts:
            tas = o.get("type_assignments") or []
            if tas:
                for ta in tas:
                    cat = TYPE_NAMES.get(ta["type_id"], current_cat)
                    row_n += 1
                    ws.append(
                        [
                            qid,
                            item["id"],
                            o.get("id"),
                            qtype,
                            multi,
                            current_cat,
                            cat,
                            qtext,
                            strip_html(o.get("option")),
                            float(ta.get("value") or 0),
                            "",
                            "",
                            "Option already assigns to this category in Agolix"
                            if ta["type_id"] != item.get("type_based_id")
                            else "",
                        ]
                    )
            else:
                row_n += 1
                ws.append(
                    [
                        qid,
                        item["id"],
                        o.get("id"),
                        qtype,
                        multi,
                        current_cat,
                        current_cat,
                        qtext,
                        strip_html(o.get("option")),
                        o.get("value") if o.get("value") is not None else 0,
                        "",
                        "",
                        "No type_assignment found — set Points + Category",
                    ]
                )

    last = ws.max_row
    add_category_validation(ws, "G", 2, max(last, 500))
    for r in range(2, last + 1):
        for c in range(1, len(headers) + 1):
            cell = ws.cell(r, c)
            cell.border = THIN
            cell.alignment = WRAP
            if c == 7:  # editable category
                cell.fill = PatternFill("solid", fgColor="E8F5E9")
            if c == 10:  # editable points
                cell.fill = PatternFill("solid", fgColor="E8F5E9")
            if c == 13 and cell.value:
                cell.fill = NOTE_FILL
    autosize(
        ws,
        {
            1: 8,
            2: 16,
            3: 14,
            4: 12,
            5: 12,
            6: 28,
            7: 30,
            8: 55,
            9: 55,
            10: 14,
            11: 28,
            12: 28,
            13: 40,
        },
    )
    ws.row_dimensions[1].height = 30


def build_bands(wb: Workbook) -> None:
    ws = wb.create_sheet("Band Thresholds")
    headers = [
        "Category",
        "Low min %",
        "Low max %",
        "Medium min %",
        "Medium max %",
        "High min %",
        "High max %",
        "Notes",
    ]
    ws.append(headers)
    style_header(ws, len(headers))
    for name in CATEGORIES:
        ws.append([name, 0, 39, 40, 69, 70, 100, "Edit if this category needs different cut-offs"])
    for r in range(2, ws.max_row + 1):
        for c in range(1, len(headers) + 1):
            ws.cell(r, c).border = THIN
            if c >= 2 and c <= 7:
                ws.cell(r, c).fill = PatternFill("solid", fgColor="E8F5E9")
    add_category_validation(ws, "A", 2, 50)
    autosize(ws, {1: 36, 2: 12, 3: 12, 4: 14, 5: 14, 6: 12, 7: 12, 8: 45})


def build_wording(wb: Workbook) -> None:
    ws = wb.create_sheet("Report Wording")
    headers = [
        "Category",
        "Band",
        "Headline",
        "What this score means",
        "Recommended actions",
        "Impact of improvement",
        "Support and resources",
        "Status",
        "Notes",
    ]
    ws.append(headers)
    style_header(ws, len(headers))

    examples = {
        ("Employment Contracts", "Low"): (
            "Employment contracts need urgent attention",
            "Your responses suggest employment agreements may be missing, incomplete, or not updated when roles change. That creates ambiguity and increases dispute risk.",
            "1) Issue written contracts to all staff.\n2) Cover Award/classification where relevant, hours, pay, leave, notice, and behaviour expectations.\n3) Use variation letters when terms change.\n4) Have templates reviewed before rollout.",
            "Clear contracts reduce underpayment and unfair-dismissal exposure and set expectations from day one.",
            "DreamStoneHR contract review; Fair Work Information Statement checklist",
            "EXAMPLE — replace with your final copy",
        ),
        ("Employment Contracts", "Medium"): (
            "Solid base — close the gaps",
            "You have some contracting foundations in place, but coverage or content is inconsistent.",
            "1) Audit which roles lack a current signed agreement.\n2) Standardise a clause checklist across templates.\n3) Confirm variation letters are used whenever terms change.",
            "Consistency makes performance and exit processes cleaner.",
            "Contract gap audit with DreamStoneHR",
            "EXAMPLE — replace with your final copy",
        ),
        ("Employment Contracts", "High"): (
            "Strong contracting practice",
            "Staff appear to be engaged on clear agreements with a process for changes.",
            "1) Review templates annually against Award and NES updates.\n2) Spot-check files for signatures and current terms.\n3) Keep training managers so variations are never skipped.",
            "Staying current protects the documentation investment you have already made.",
            "Annual HR compliance retainer options",
            "EXAMPLE — replace with your final copy",
        ),
        ("Psychosocial Risk & Positive Duty", "Low"): (
            "Psychosocial risk and Positive Duty need focused attention",
            "A low score suggests significant gaps in how psychosocial risks are identified, managed and prevented — including sexual harassment and related Positive Duty obligations.",
            "1) Identify key psychosocial hazards.\n2) Clarify behavioural expectations.\n3) Strengthen safe reporting pathways.\n4) Build leader capability on prevention and Positive Duty.",
            "Better prevention improves wellbeing and reduces formal complaints and regulatory exposure.",
            "Respect at Work & Positive Duty guidance; Psychological safety resources",
            "EXAMPLE — replace with your final copy",
        ),
        ("Psychosocial Risk & Positive Duty", "Medium"): (
            "Foundations exist — strengthen prevention",
            "Some practices are in place but they are not yet consistent or fully embedded.",
            "1) Map hazards to owners and controls.\n2) Train all leaders on early intervention.\n3) Test that staff know how to raise concerns safely.",
            "Moves the business from reactive handling to proactive prevention.",
            "DreamStoneHR psychosocial risk workshop",
            "EXAMPLE — replace with your final copy",
        ),
        ("Psychosocial Risk & Positive Duty", "High"): (
            "Strong prevention posture",
            "Responses indicate clear expectations, reporting pathways, and leadership capability around psychosocial risk.",
            "1) Review controls after any incident or near miss.\n2) Keep Positive Duty obligations visible in induction and leader training.\n3) Measure psychological safety in engagement feedback.",
            "Sustains trust and reduces the chance issues escalate into complaints.",
            "Periodic Positive Duty health check with DreamStoneHR",
            "EXAMPLE — replace with your final copy",
        ),
    }

    bands = ["Low", "Medium", "High"]
    for cat in CATEGORIES:
        for band in bands:
            key = (cat, band)
            if key in examples:
                h, means, actions, impact, support, status = examples[key]
            else:
                h = means = actions = impact = support = ""
                status = "TODO — add your wording"
            ws.append([cat, band, h, means, actions, impact, support, status, ""])

    # Dropdowns
    cat_dv = DataValidation(
        type="list",
        formula1='"' + ",".join(CATEGORIES) + '"',
        allow_blank=True,
    )
    band_dv = DataValidation(type="list", formula1='"Low,Medium,High"', allow_blank=True)
    ws.add_data_validation(cat_dv)
    ws.add_data_validation(band_dv)
    cat_dv.add(f"A2:A{ws.max_row + 50}")
    band_dv.add(f"B2:B{ws.max_row + 50}")

    for r in range(2, ws.max_row + 1):
        for c in range(1, len(headers) + 1):
            cell = ws.cell(r, c)
            cell.border = THIN
            cell.alignment = WRAP
            if c in (3, 4, 5, 6, 7):
                cell.fill = PatternFill("solid", fgColor="E8F5E9")
            if ws.cell(r, 8).value and str(ws.cell(r, 8).value).startswith("TODO"):
                ws.cell(r, 8).fill = NOTE_FILL
            if ws.cell(r, 8).value and str(ws.cell(r, 8).value).startswith("EXAMPLE"):
                ws.cell(r, 8).fill = SECTION_FILL
        ws.row_dimensions[r].height = 60

    autosize(
        ws,
        {1: 32, 2: 10, 3: 32, 4: 45, 5: 45, 6: 35, 7: 35, 8: 28, 9: 25},
    )


def main() -> None:
    questions = json.loads(QUESTIONS_PATH.read_text())
    wb = Workbook()
    build_instructions(wb)
    build_categories(wb)
    build_questions(wb, questions)
    build_bands(wb)
    build_wording(wb)
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    wb.save(OUT_PATH)
    print(f"Wrote {OUT_PATH}")


if __name__ == "__main__":
    main()
