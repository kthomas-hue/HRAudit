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

## v3 engine (build from the pack)

```bash
pip install -r engine/requirements.txt
python3 engine/extract_pack.py
python3 engine/cli.py --scenario sandbox --format markdown
python3 -m unittest discover -s engine/tests -v
```

Source of truth: `docs/scoring-pack/DreamStoneHR_HR_Health_Check_Risk_and_Action_Build_Pack_v3.xlsx`

## Legacy Agolix sample validation

```bash
python3 scoring/validate_sample.py
```

## Status

- **Live Agolix assessment:** not market-ready (Psychosocial stuck at 0%, type misassigns). See `docs/MARKET_READINESS_REVIEW.md`.
- **v3 pack + engine:** sandbox scoring matches the pack Client Preview (91.0, 4 high-priority alerts). App/pilot/legal release gates in the pack remain OPEN.
