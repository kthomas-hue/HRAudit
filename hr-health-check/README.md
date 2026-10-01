# DreamStoneHR — HR Health Check

Interactive self-assessment for business leaders, rebuilt to match the look and feel of [dreamstonehr.com.au](https://www.dreamstonehr.com.au).

## Run locally

```bash
cd hr-health-check
npm install
npm run dev
```

Open:
- Health Check: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin` (password `dreamstone`)

## Build / preview

```bash
npm run build
npm run preview
```

## What’s included

- Branded landing, contact capture, multi-section assessment, and a paid-quality leadership brief
- Per-category timed actions (This week / 30 days / 90 days) and resource links
- Client **Download your report** (HTML you can Print → Save as PDF)
- **Admin Responses** inbox — every completion with client details + report download
- Progress persistence in `localStorage`
- Content admin for questions, categories, report copy, and settings
- Local JSON API (`/api/responses`) so submissions persist across browsers while you test

## Admin portal

1. Open `/admin` and sign in (`dreamstone` by default — change under **Settings**).
2. Tabs:
   - **Responses** — search clients, view contact + scores + answers, download report, export CSV
   - **Settings** — landing copy, contact details, privacy URL, CTA, admin password
   - **Categories / Questions / Report content** — build and edit the assessment and brief
   - **Import / Export** — JSON content pack backup

## How responses work

When someone finishes the Health Check, a submission is saved to:
1. Browser `localStorage`, and
2. `data/responses.json` via the Vite `/api/responses` endpoint (dev + preview)

Open **Admin → Responses** to review and download each leadership brief.

> Content edits still live in the browser that edits them (export JSON to share). Submission storage is file-based for local testing; we can wire a hosted database when you go live.
