# HR Health Check app (owned product)

Public assessment + admin portal, backed by SQLite and the v3 scoring engine.

## Run

```bash
pip install -r app/requirements.txt -r engine/requirements.txt
cd /path/to/repo
export PYTHONPATH=$PWD:$PWD/engine
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

- Assessment: http://127.0.0.1:8000/
- Admin: http://127.0.0.1:8000/admin/  
  Default login `admin@dreamstonehr.com.au` / `dreamstone`

## Admin

| Area | Actions |
|---|---|
| Submissions | Search users, see status/score, open reports, download `.md` / `.json` |
| Content | Edit questions, response options, report band copy; export / reload pack |
| Settings | Change password, product contact settings |

## Notes

- Sessions and content persist in SQLite (`data/hr_health_check.db` or `HRHC_DB`)
- Set `HRHC_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` for production
- Client Preview still available on the public UI (stored as `is_preview` submissions)
