# HR Health Check — Market Readiness Review

**Assessment:** [DreamStoneHR HR Health Check](https://app.assessmentgenerator.com/assessment/17307) (Agolix / Assessment Generator `#17307`)  
**Reviewed:** 2026-10-07  
**Verdict:** **Not market-ready** until scoring → report routing for Psychosocial Risk & Positive Duty is fixed, and category type assignments are cleaned up.

---

## Executive answers

### How is the scoring going?

The **math works** for 11 of 12 categories. We reverse-engineered the live type-based scoring model from the public assessment payload and replayed the sample result set in `HR Health Checkresults.pdf`:

| Category | Sample % | Simulated % |
|---|---:|---:|
| Pay & Entitlements | 53 | 53 |
| Employment Contracts | 6 | 6 |
| Recruitment & Talent | 36 | 36 |
| New Hires & Onboarding | 24 | 24 |
| Policies & Procedures | 51 | 51 |
| Workplace Health & Safety | 43 | 43 |
| Reviewing & Managing Performance | 63 | 63 |
| Training & Development | 12 | 12 |
| Culture & Engagement | 78 | 78 |
| Record Keeping | 65 | 65 |
| Employee Exits | 46 | 46 |
| **Psychosocial Risk & Positive Duty** | **0** | **n/a — no scored questions** |
| Overall Score | 47 | 47 |

Reproducible check: `python3 scoring/validate_sample.py`

### Are you comfortable each score/response selection gets the right report?

**No — not yet.**

1. **Psychosocial Risk & Positive Duty always scores 0%.**  
   No questions contribute points to that type. Every respondent gets the **low-band** Psychosocial report section (confirmed live: results showed 0%, PDF page ~15 always opens with “A low score in the Psychosocial Risk & Positive Duty section…”). Sexual harassment, FDV leave, EAP/mental health, and wellbeing answers currently score into **Policies**, **WHS**, or **Culture** instead — so the Psychosocial report does **not** reflect those responses.

2. **Score-band PDF recommendations do fire per category** when a type has real scores (Pay, Contracts, Training, etc.). That part of Agolix type-based bands is working.

3. **Several questions are miscategorised**, so a “correct” band report can still be the *wrong narrative* for what the user answered (see Critical / High issues below).

---

## Product shape

- **Platform:** Agolix Assessment Generator, type-based assessment, `score_as_percent=1`, `typebased_score_bands=1`, results screen + email + PDF on.
- **65 questions:** 25 scale, 25 binary, 14 option (6 multi-select), 1 narrative feedback.
- **12 result types** shown on the results page / PDF.
- **10 named “sections”** exist in config but **are unused** (`section_id` is null on every question). Scoring is driven by `type_based_id` + option `type_assignments`.

### Type ID map (inferred from question content + live results)

| Type ID | Name |
|---|---|
| 31326 | Pay & Entitlements |
| 31327 | Employment Contracts |
| 31328 | Recruitment & Talent |
| 31329 | New Hires & Onboarding |
| 31330 | Policies & Procedures |
| 31331 | Workplace Health & Safety |
| 31332 | Reviewing & Managing Performance |
| 31333 | Training & Development |
| 31334 | Culture & Engagement |
| 31335 | Record Keeping |
| 31336 | Employee Exits |
| *(unknown / empty)* | Psychosocial Risk & Positive Duty |

Scoring rule validated against the sample:

- **Scale / binary:** points go to the question’s `type_based_id`; max = max(left, right) (typically right/Yes weight).
- **Single-select option:** points from that option’s `type_assignments`.
- **Multi-select:** earned = sum of selected option type values; max = sum of all option type values for that type on the question.
- **Overall** = total earned points / total max points across all types (not the mean of category %).

---

## Critical blockers (fix before launch)

### 1. Psychosocial Risk & Positive Duty is a dead type (always 0%)

- Appears on results + in the PDF with low-band recommendations every time.
- Related live questions are scored elsewhere:
  - Sexual harassment → Policies (31330)
  - FDV leave → Policies (31330)
  - EAP / mental health readiness → WHS (31331)
  - Wellbeing & culture → Culture (31334)
  - Campaigns (RUOK?, Mental Health Week, etc.) → WHS (31331)
- **Market risk:** every lead is told they have a critical psychosocial gap, which undermines credibility and can create unnecessary alarm.

**Fix in Agolix:** Assign a Psychosocial type ID to the relevant questions (or remove the type from results until wired). Re-test that mid/high answers move the band text.

### 2. Pay & Entitlements is a dumping ground (36 questions tagged 31326)

Many non-pay questions have `type_based_id = 31326`. Multi-selects often *option-assign* to the right type (so sample math still matched), but **scale/binary** questions permanently pollute Pay scores, including:

- Workplace consultation readiness
- General protections
- Unfair dismissal vs adverse action + confidence
- IFA knowledge
- FT/PT/casual understanding (borderline — more employment-status than pure pay)
- Narrative feedback question has `enable_score=True` under Pay

**Fix:** Remap each question’s Type to the thematic category (see `scoring/TYPE_REMAP.md`).

### 3. Zero required questions

All 65 questions are `required: false`. Respondents can skip heavily and still get a full report. Sparse answers distort percentages (unanswered questions are excluded from both earned and max in Agolix’s observed behaviour when skipped).

**Fix:** Require all scored questions (leave only the final narrative optional).

---

## High priority

| Issue | Why it matters |
|---|---|
| **Training & Development has only one multi-select** (3 progressive options, select-all). Users can select contradictory tiers; max becomes 2+5+10=17. | Thin, gameable category; band report may not reflect real capability. |
| **Onboarding is thin** (work-rights binary + one multi-select checklist). | Category swings hard on checklist ticks. |
| **Employment Contracts multi-select clauses** each worth 2 (max 24) while “issued a contract?” is only 5. | Someone with no contracts but many clauses checked (if the UI allows) could look stronger than reality; opposite weighting may undervalue having contracts at all. |
| **Inconsistent binary Yes weights** (2, 3, 4, or 5) and one scale capped at 5 (IFA). | Uneven influence inside categories; hard to explain to clients. |
| **Position Descriptions multi-select** includes “We do not have PDs” (0) alongside positive options — select-all UX allows nonsense combinations. | Dirty data → wrong Recruitment score. |
| **Privacy legal text links to Agolix’s respondent privacy policy**, not DreamStoneHR’s. | Compliance / trust issue for an AU HR product collecting phone + email + company. |
| **Registration copy** says “log in or create your access using the email address connected with your HR Health Check” — sounds gated, but the assessment is open lead-gen. | Confuses first-time users. |

---

## Medium / polish

- Welcome body text has had rendering/overlap issues in PDF captures of the registration page (“Welcome…” / “You’re in the right place”).
- Footer contact OCR/print artifacts in page PDFs (`@dreramstoneHR`, truncated URLs) — verify live footer assets.
- `sections` list (10 names) is out of sync with the 12 result types — unused but confusing for anyone editing the assessment later.
- Option-level `feedback` is unused (`feedback_type: NONE` everywhere); all personalisation is via **type score bands** in the PDF only. Web results page is scores + Q&A, not recommendations.
- No captcha (`use_captcha: false`) with `allow_multiple_responses: true` — fine for lead gen, but expect junk submissions.

---

## What is working well

- Live assessment completes end-to-end; PDF report (~26 pages) generates with branded DreamStoneHR sections, recommended actions, impact, and resource links.
- Category score-band recommendations appear for categories that actually receive points.
- Sample historical result (`HR Health Checkresults.pdf`) is internally consistent with the live scoring engine (11/11 + overall).
- Chart + overall % presentation is clear for a self-assessment lead magnet.

---

## Recommended launch checklist

1. **Wire Psychosocial type** to the right questions; confirm 0% is no longer universal; confirm mid/high bands change PDF copy.
2. **Apply type remaps** in `scoring/TYPE_REMAP.md`; re-run `scoring/validate_sample.py` logic against a fresh controlled submission (expect sample % to change — update the golden fixture after intentional remaps).
3. **Mark scored questions required**; keep narrative optional.
4. **Tighten Training / Onboarding / PD / contract multi-selects** (single-select progressive where options are tiers; mutually exclusive “none” options).
5. **Replace privacy link** with DreamStoneHR privacy policy; fix registration intro copy.
6. **QA matrix:** for each of the 12 types, submit a low / mid / high path and screenshot the PDF band text (store under `docs/qa-evidence/`).
7. Only then treat as market-ready.

---

## Evidence

- Live results with Psychosocial at 0%: see walkthrough artifacts under `/opt/cursor/artifacts/hrhc-review/`
- Scoring replay: `scoring/validate_sample.py` + `scoring/questions.json` (exported from live assessment HTML)
- Source PDFs in repo root are page captures of the questionnaire + one sample results print — not alternate report variants
