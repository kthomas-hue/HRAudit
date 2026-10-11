# HR Health Check assessment UI

FastAPI + static front end for the DreamStoneHR Health Check, driven by the v3 scoring pack and engine.

## Run locally

```bash
pip install -r app/requirements.txt -r engine/requirements.txt
cd /path/to/repo
export PYTHONPATH=$PWD:$PWD/engine
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Open `http://127.0.0.1:8000/`.

- **Begin assessment** — contact → unscored profile (routing) → eligible questions → scored Client Preview report
- **Client Preview** — loads the pack Score Sandbox demo (fictional inputs) and shows the report immediately

## API smoke

```bash
PYTHONPATH=$PWD:$PWD/engine python3 -m unittest app.tests.test_api -v
```

## Notes

- In-memory sessions only (suitable for local demos; not multi-instance production storage)
- Profile answers are unscored; they only enable conditional question routes
- “Need to confirm” / unsure keeps follow-ups on; confirmed “no” turns them off
