# DreamStoneHR health check

A self-review for Australian business owners. It covers contracts, award coverage, payroll, leave, safety (including psychological safety), conduct, the employee lifecycle, and records. The report ranks risk and gives actions an owner can start without waiting for a meeting.

The PDFs in this repository are earlier exports of a health check. This app is the review itself.

## Run it

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173.

Answers stay in the browser. The report is on the page, and it can be printed. If the client leaves an email, that address receives the full report and `HRSupport@dreamstonehr.com.au` receives a short notification. A local copy of the contact line is appended to `data/leads.jsonl` (not committed).

Sending needs SMTP settings in the environment: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and optionally `MAIL_FROM` and `SMTP_SECURE=true` for port 465. Without those, the report stays on the page and the unsent emails are written to `data/outbox/`.

This is general information, not legal advice.
