# DreamStoneHR — HR Health Check

Interactive self-assessment for business leaders, rebuilt to match the look and feel of [dreamstonehr.com.au](https://www.dreamstonehr.com.au).

## Run locally

```bash
cd hr-health-check
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## What’s included

- Branded landing, contact capture, multi-section assessment, and a paid-quality leadership brief
- Per-category timed actions (This week / 30 days / 90 days) and resource links (Fair Work, Safe Work, etc.)
- Progress persistence in `localStorage` (resume / start fresh)
- Scale, yes/no, single-choice, and multi-select question types
- Category and overall scoring with priorities and strengths
- **Admin portal** at `/admin` to edit everything without touching code

## Admin portal — edit questions, report content & links

1. Open `/admin` (e.g. `http://localhost:5173/admin`).
2. Sign in with the default password: `dreamstone` (change it under **Settings**).
3. Use the tabs:
   - **Settings** — product name, landing copy, contact details, privacy URL, partner CTA, admin password
   - **Categories** — add / rename / remove assessment sections
   - **Questions** — edit prompts, types, options, scores; plus the optional feedback question
   - **Report content** — stakes, risk copy, report detail, timed actions, and resource links per category
   - **Import / Export** — download a JSON content pack, paste to import, or reset to defaults

Edits save automatically in the browser (`localStorage`). Download a JSON pack to back up or share with your team.

> Note: this is a client-side CMS (no backend yet). Content lives in the browser that edits it. For a shared production source of truth, export the JSON and commit it, or we can wire a backend later.
