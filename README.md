# DreamStoneHR — HR Health Check (owned product)

Fully owned assessment product: public questionnaire, v3 scoring engine, SQLite persistence, and an admin portal. **No Agolix / third-party survey runtime.**

## Quick start

```bash
pip install -r app/requirements.txt -r engine/requirements.txt
export PYTHONPATH=$PWD:$PWD/engine
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

| URL | Purpose |
|---|---|
| http://127.0.0.1:8000/ | Public HR Health Check |
| http://127.0.0.1:8000/admin/ | Admin portal |

**Default admin:** `admin@dreamstonehr.com.au` / `dreamstone`  
Change the password under **Admin → Settings** after first login.

### Production environment

```bash
export HRHC_SECRET='long-random-string'
export ADMIN_EMAIL='you@dreamstonehr.com.au'
export ADMIN_PASSWORD='strong-password'
export HRHC_DB=/var/lib/hrhc/hr_health_check.db   # optional path override
```

The SQLite database defaults to `data/hr_health_check.db` (created on first boot).

## What you own

| Capability | How |
|---|---|
| Run the survey | Your FastAPI app — no Agolix |
| See who started / completed | **Admin → Submissions** |
| Open a user’s report | Click a submission → view + download `.md` / `.json` |
| Edit questions & answers | **Admin → Content** |
| Edit report band wording | **Admin → Content** (report copy section) |
| Bulk refresh from Excel | Edit pack → `python3 engine/extract_pack.py` → Admin “Reload from Excel extract” |
| Change admin password | **Admin → Settings** |

## Admin features

- Password-protected admin (signed cookie session)
- Dashboard with search / status filters
- Submission detail: contact, score, alerts, full written report, answer codes
- Download report markdown or JSON
- Content editor for question text, response labels, scoring points, report copy
- Export live content pack JSON
- Reload pack from `engine/data/pack.json`

## Scoring engine

Source of truth for bulk authoring:

`docs/scoring-pack/DreamStoneHR_HR_Health_Check_Risk_and_Action_Build_Pack_v3.xlsx`

```bash
python3 engine/extract_pack.py
python3 engine/cli.py --scenario sandbox --format markdown
python3 -m unittest discover -s engine/tests -v
```

Live runtime content is stored in SQLite (`content_pack` table), seeded once from `engine/data/pack.json`.

## Tests

```bash
export PYTHONPATH=$PWD:$PWD/engine
python3 -m unittest app.tests.test_api -v
python3 -m unittest engine.tests.test_engine -v
```

## Repo layout

| Path | Purpose |
|---|---|
| `app/` | Public assessment UI + admin portal + SQLite persistence |
| `engine/` | Scoring / report assembly |
| `docs/scoring-pack/` | Excel authoring pack |
| `data/` | Local SQLite DB (gitignored) |
| `scoring/` | Legacy Agolix export validation (reference only) |

## Status

- **Owned product path:** assessment + admin + persistence — ready for DreamStoneHR to host.
- Legacy Agolix assessment captures remain in the repo for reference only; they are not required to run this product.
