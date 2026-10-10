# Scoring pack — worked example

This is the format to fill. Below is a **mini pack** for two categories only, using real HR Health Check questions, so you can see the level of detail needed.

When you’re ready for the full product, copy the blank templates in `docs/scoring-pack/` and complete **all 12 categories**.

---

## How the three sheets fit together

```
Questions & weights  →  produce a % per category
Band thresholds      →  turn that % into Low / Medium / High
Report wording       →  the PDF text for that band
```

Example path:

1. User answers the Employment Contracts questions → score **18%**
2. 18% falls in **Low** (0–39)
3. PDF shows the **Low** Employment Contracts wording

---

## Sheet 1 — Questions & weights

One row per answer option.  
**Points** should make sense as “how strong is this answer?” (0 = weak / non-compliant, higher = stronger).  
For scales, treat the slider value as the points (1–10), max = 10.

### Employment Contracts (example)

| Q_ID | Category | Question (short) | Answer option | Points | Notes |
|---|---|---|---|---:|---|
| C1 | Employment Contracts | Are all staff issued with an Employment Agreement / Contract? | Yes | 10 | |
| C1 | Employment Contracts | Are all staff issued with an Employment Agreement / Contract? | No | 0 | |
| C2 | Employment Contracts | Are variation letters issued when employment changes? | Yes | 5 | |
| C2 | Employment Contracts | Are variation letters issued when employment changes? | No | 0 | |
| C3 | Employment Contracts | Contract includes: Relevant Modern Award & classification | Checked | 2 | Multi-select; each tick adds points |
| C3 | Employment Contracts | Contract includes: Hours of work | Checked | 2 | |
| C3 | Employment Contracts | Contract includes: Wages / salary & reasonable overtime | Checked | 2 | |
| C3 | Employment Contracts | Contract includes: Leave entitlements | Checked | 2 | |
| C3 | Employment Contracts | Contract includes: Notice periods (NES) | Checked | 2 | |
| C3 | Employment Contracts | *(…remaining clause ticks)* | Checked | 2 each | List every clause the same way |

**How % is calculated for this category**

- Max points = best possible total (here: 10 + 5 + (2 × number of clause options))
- Earned = sum of what they selected
- Category % = earned ÷ max × 100

So if someone answers: No contract (0), No variations (0), only “Wages/salary” checked (2), and there are 12 clause options (max 24):

`earned = 0+0+2 = 2`  
`max = 10+5+24 = 39`  
`% = 2/39 ≈ 5%` → **Low** band

### Psychosocial Risk & Positive Duty (example — this is the broken one today)

| Q_ID | Category | Question (short) | Answer option | Points | Notes |
|---|---|---|---|---:|---|
| P1 | Psychosocial | Would you know what to do if a sexual harassment claim arose at work or a work function? | Yes | 10 | Move here from Policies |
| P1 | Psychosocial | Would you know what to do if a sexual harassment claim arose at work or a work function? | No | 0 | |
| P2 | Psychosocial | Understanding of Family & Domestic Violence leave + how to support staff | Scale 1–10 | value | 1 = “need to understand better”, 10 = policies/training/support in place |
| P3 | Psychosocial | EAP access + readiness for a workplace mental health concern | Scale 1–10 | value | |
| P4 | Psychosocial | Participate in: RUOK? Day | Checked | 3 | Optional campaign ticks |
| P4 | Psychosocial | Participate in: Mental Health Week | Checked | 3 | |
| P4 | Psychosocial | Participate in: Domestic Violence Awareness Month | Checked | 3 | |

If these stay on other categories, Psychosocial will keep showing **0%** and always get Low wording.

---

## Sheet 2 — Band thresholds

One row per category. Use the same cut-offs across categories unless you have a reason not to.

| Category | Low (inclusive) | Medium (inclusive) | High (inclusive) |
|---|---|---|---|
| Employment Contracts | 0–39% | 40–69% | 70–100% |
| Psychosocial Risk & Positive Duty | 0–39% | 40–69% | 70–100% |
| Pay & Entitlements | 0–39% | 40–69% | 70–100% |
| *(repeat for all 12)* | | | |

---

## Sheet 3 — Report wording (what the PDF says)

One block per **category × band**. Write the final client-facing copy.

### Employment Contracts — LOW (example)

**Headline:** Employment contracts need urgent attention  

**What this score means:**  
Your responses suggest employment agreements may be missing, incomplete, or not updated when roles change. That creates ambiguity for both the business and employees and increases risk if a dispute arises.

**Recommended actions:**
1. Issue written employment contracts to all staff.
2. Ensure each contract covers Award/classification (where relevant), hours, pay, leave, notice, and key behavioural expectations.
3. Use variation letters when hours, duties, or reporting lines change.
4. Have contracts reviewed by DreamStoneHR or a qualified adviser before rollout.

**Impact of improvement:**  
Clear contracts reduce underpayment and unfair-dismissal exposure and set expectations from day one.

**Support / resources:**  
- DreamStoneHR employment contract review  
- Fair Work Information Statement checklist  

---

### Employment Contracts — MEDIUM (example)

**Headline:** Solid base — close the gaps  

**What this score means:**  
You have some contracting foundations in place, but coverage or content is inconsistent.

**Recommended actions:**
1. Audit which roles still lack a current signed agreement.
2. Standardise a clause checklist and apply it to all templates.
3. Confirm variation letters are used every time terms change.

**Impact of improvement:**  
Consistency across the workforce makes performance and exit processes cleaner.

**Support / resources:**  
- Contract gap audit with DreamStoneHR  

---

### Employment Contracts — HIGH (example)

**Headline:** Strong contracting practice  

**What this score means:**  
Your responses indicate staff are engaged on clear, reasonably complete agreements with a process for changes.

**Recommended actions:**
1. Review templates annually against Award and NES updates.
2. Spot-check a sample of files for signatures and current terms.
3. Keep building manager capability so variations are never skipped.

**Impact of improvement:**  
Staying current protects the investment you’ve already made in good documentation.

**Support / resources:**  
- Annual HR compliance retainer options  

---

### Psychosocial — LOW / MEDIUM / HIGH

Same structure: Headline → What this means → Recommended actions → Impact → Resources.  
Write all three bands even if you start with Low only — otherwise Medium/High users still see the wrong story later.

---

## What “good enough” looks like from you

For the full pack, send:

1. **Questions & weights** — every scored question, every option, points, category  
2. **Bands** — Low/Med/High % for all 12 categories  
3. **Report wording** — 12 categories × 3 bands = **36 wording blocks**

You do **not** need to write code or touch Agolix for this step. Paste into the CSVs in `docs/scoring-pack/` (or a Google Sheet with the same columns) and share it back.

## Tips so we don’t rework it

- Prefer **one category per question** (don’t dual-score unless you really mean it).
- For “pick the best description” questions, use **single-select**, not select-all.
- For “tick everything that applies” checklists, multi-select is fine; list every tick’s points.
- “Doesn’t apply to us” answers should still get a sensible score (often full or near-full points), not zero — zero looks like failure.
- Keep band cut-offs simple unless a category truly needs different thresholds.
