# HR Health Check v3 engine

Scoring and Client Preview assembly driven by:

`docs/scoring-pack/DreamStoneHR_HR_Health_Check_Risk_and_Action_Build_Pack_v3.xlsx`

## Setup

```bash
pip install -r engine/requirements.txt
python3 engine/extract_pack.py   # refresh JSON from the Excel pack
```

## Score the sandbox demo

```bash
python3 engine/cli.py --scenario sandbox --format markdown
python3 engine/cli.py --scenario sandbox --format both --out /tmp/preview.md
```

Scenarios: `sandbox`, `all3`, `all0`, `all_dk`, `custom` (with `--responses file.json`).

## Tests

```bash
python3 -m unittest engine.tests.test_engine -v
# or
cd engine && python3 -m unittest tests.test_engine -v
```

The sandbox test asserts the pack’s cached Client Preview numbers:

- Published score **91.0**
- Position **Priority review required**
- **4** High-priority alerts (`PAY02`, `PAY04`, `LND03`, `PSY04`)
- Psychosocial score moves with answers (no longer stuck at 0%)

## Layout

| Path | Role |
|---|---|
| `extract_pack.py` | Excel → `data/pack.json` |
| `score.py` | Domain/overall scoring + alerts/workstreams |
| `report.py` | Markdown / JSON Client Preview |
| `cli.py` | Command-line runner |
| `data/` | Extracted pack JSON |
| `tests/` | Regression tests against pack sandbox |
