# Recommended type remaps (Agolix admin)

Apply these in Assessment Generator → Assessment 17307 → question Type / option type assignments.  
Goal: each answer feeds the category whose PDF band the respondent will read.

## Psychosocial Risk & Positive Duty (new / empty type)

Move **to Psychosocial** (create/confirm type, then assign):

| Question (summary) | Current type | Action |
|---|---|---|
| Sexual harassment claim readiness | Policies (31330) | → Psychosocial |
| Family & Domestic Violence leave understanding | Policies (31330) | → Psychosocial |
| EAP / mental health workplace readiness | WHS (31331) | → Psychosocial (or split: EAP→Psychosocial, keep pure WHS items) |
| Campaigns: RUOK?, Mental Health Week, DV Awareness | Options → WHS (31331) | → Psychosocial (keep Safe Work Month / Dry July on WHS if desired) |
| Wellbeing & culture scale | Culture (31334) | Consider dual-score or keep on Culture; do **not** leave Psychosocial empty |

Until this is done, **delete or hide** Psychosocial from results, or every report will show 0% + low-band copy.

## Pay & Entitlements (31326) — remove non-pay parents

These have `type_based_id = 31326` today; multi-selects already option-assign elsewhere, but parent type should match:

| Question | Options already score to | Set question Type to |
|---|---|---|
| Position Descriptions (multi) | Recruitment (31328) | Recruitment |
| Interview process (multi) | Recruitment (31328) | Recruitment |
| Employment agreement clauses (multi) | Contracts (31327) | Contracts |
| Timesheets | Record Keeping (31335) | Record Keeping |
| Onboarding information checklist | Onboarding (31329) | Onboarding |
| Small business dismissal / redundancy understanding | Exits (31336) | Exits |
| Training & development approach | Training (31333) | Training |
| Awareness campaigns | WHS (31331) / Psychosocial | Matching target |

Scale/binary currently scoring into Pay that should move:

| Question | Suggested type |
|---|---|
| Workplace consultation for major change | Employee Exits (or new Change Management — else Exits) |
| General protections knowledge | Employee Exits / Psychosocial-adjacent risk — prefer **Exits** or new **ER Risk** |
| Unfair dismissal vs adverse action | Employee Exits |
| Unfair dismissal confidence | Employee Exits |
| IFA knowledge | Pay & Entitlements (keep) **or** Contracts — recommend **Contracts** |
| Contractor vs employee / sham contracting | Contracts |
| FT/PT/casual differences | Pay (keep) or Contracts — recommend **Contracts** |
| Narrative feedback | Disable scoring / no type |

## Other cleanups

| Question | Current | Suggested |
|---|---|---|
| Policy acknowledgement in writing | Record Keeping | Policies |
| Evacuation procedures | WHS | WHS (OK) or Policies — WHS is fine |
| Alcohol/drugs response | WHS | WHS (OK) or Psychosocial if framed as behaviour risk |

## Multi-select UX fixes

1. **Training tiers** — change to single-select (pick the best description), max = 10.
2. **Position Descriptions** — make “We do not have PDs” exclusive (or single-select maturity scale).
3. **Employment agreement clauses** — keep multi-select; ensure “No contract issued” path doesn’t still show clause checklist (use display logic), or weight “issued contract?” much higher.

## After remapping

1. Complete three controlled runs: all-low, mixed (replay sample answers), all-high.
2. Confirm Psychosocial % moves with sexual harassment / FDV / EAP answers.
3. Update `scoring/validate_sample.py` expected percentages to the new golden values.
4. Screenshot PDF bands for low/mid/high on each of the 12 types.
