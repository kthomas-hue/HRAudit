# DreamStoneHR — HR Health Check

Lead-gen self-assessment hosted on Agolix Assessment Generator:

**https://app.assessmentgenerator.com/assessment/17307**

## Repo contents

| Path | Purpose |
|---|---|
| `HR Health Check.pdf` … `HR Health Check13.pdf` | Page captures of the live questionnaire |
| `HR Health Checkresults.pdf` | Sample completed results (scores + Q&A) |
| `docs/MARKET_READINESS_REVIEW.md` | Full market-readiness + scoring audit |
| `docs/SCORING_PACK_EXAMPLE.md` | Worked example of the content pack to fill in |
| `docs/scoring-pack/HR_Health_Check_Scoring_Pack.xlsx` | **Single Excel pack to edit** (questions, bands, wording) |
| `docs/scoring-pack/*.csv` | CSV copies of the same structure |
| `scoring/build_scoring_pack_xlsx.py` | Regenerates the Excel from `questions.json` |
| `scoring/questions.json` | Exported live question/scoring model |
| `scoring/validate_sample.py` | Replays sample answers; asserts category % |
| `scoring/TYPE_REMAP.md` | Agolix admin remaps required before launch |

## Scoring validation

```bash
python3 scoring/validate_sample.py
```

## Status

**Not market-ready.** See `docs/MARKET_READINESS_REVIEW.md`.

Headline risks:

1. **Psychosocial Risk & Positive Duty always scores 0%** (no questions wired) → every PDF gets the low-band psychosocial report.
2. Many questions are tagged to **Pay & Entitlements** while thematically belonging elsewhere.
3. **No questions are required**, so incomplete submissions still produce a full report.
