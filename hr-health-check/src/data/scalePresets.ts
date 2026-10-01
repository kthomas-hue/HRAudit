import type { ScaleConfig } from './questions'

/** Shared 1–10 ladder for familiarity / confidence questions */
export const FAMILIARITY_STEPS = [
  '1 — Not at all. I couldn’t explain the basics if asked.',
  '2 — I’ve heard of it, but I couldn’t apply it to our business.',
  '3 — Limited awareness. I’d need to look almost everything up.',
  '4 — I know a few concepts, with significant gaps.',
  '5 — Working knowledge of the basics; unsure on edge cases.',
  '6 — I can handle routine situations with some research.',
  '7 — Comfortable for most day-to-day leadership decisions.',
  '8 — Strong knowledge — I can guide managers, with rare external advice.',
  '9 — Very confident across almost all situations we face.',
  '10 — Fully confident. We’ve verified this in practice and could train others.',
]

export const CONFIDENCE_STEPS = [
  '1 — Not confident. This is an active concern for the business.',
  '2 — We’ve never properly checked this.',
  '3 — Low confidence. Gaps are likely.',
  '4 — Some checks done, but incomplete.',
  '5 — Partially confident — known weak spots remain.',
  '6 — Mostly on track, with a few roles or processes to verify.',
  '7 — Comfortable for most of the workforce.',
  '8 — Strong — documented and reviewed in the last 12 months.',
  '9 — Very high confidence across teams and managers.',
  '10 — Fully comfortable. Alignment is accurate, documented, and current.',
]

export const PRACTICE_STEPS = [
  '1 — This is not a strength. Practices are ad hoc or missing.',
  '2 — Rarely done well, or only when something goes wrong.',
  '3 — Inconsistent. Depends heavily on who is managing.',
  '4 — Some structure exists, but it’s uneven.',
  '5 — Basic process in place with noticeable gaps.',
  '6 — Generally solid, with room to tighten.',
  '7 — Clear process that most managers follow.',
  '8 — Consistent, fair, and documented across the business.',
  '9 — Strong practice with regular review and ownership.',
  '10 — Exemplar practice — transparent, consistent, and high acceptance.',
]

const OVERRIDES: Record<string, string[]> = {
  'pay-fwa-familiarity': [
    '1 — Not familiar at all. I couldn’t explain what the Fair Work Act or Modern Awards require.',
    '2 — I’ve heard of Awards, but wouldn’t know which ones apply to us.',
    '3 — Limited awareness. I’d need an advisor for almost every pay decision.',
    '4 — I know Awards exist and cover some of our roles, with big gaps.',
    '5 — I understand the basics (minimum rates, some entitlements) but not classifications in detail.',
    '6 — I can navigate Awards for common roles with some research.',
    '7 — Comfortable explaining how the Fair Work Act and Awards apply to most of our workforce.',
    '8 — Strong familiarity — I can check classifications and guide managers on most Award questions.',
    '9 — Very familiar across our Awards and how they interact with contracts and payroll.',
    '10 — Expert-level familiarity. We’ve mapped roles to Awards and keep that mapping current.',
  ],
  'pay-nes-comfort': [
    '1 — I’m not aware of what the National Employment Standards are.',
    '2 — I’ve heard of NES but couldn’t list what they cover.',
    '3 — Limited comfort — I’d need to look up every NES question.',
    '4 — I know a few NES items (e.g. annual leave) but not the full set.',
    '5 — Working knowledge of the main NES entitlements; unsure on edge cases.',
    '6 — Comfortable applying NES for most employees with occasional checks.',
    '7 — Confident NES applies correctly across FT / PT / casual arrangements.',
    '8 — Strong — we can explain NES entitlements to staff and managers clearly.',
    '9 — Very confident we meet NES and can spot issues early.',
    '10 — Fully confident. We know the NES, apply them correctly, and can evidence compliance.',
  ],
  'pay-award-classification': CONFIDENCE_STEPS,
  'pay-employment-types': [
    '1 — Not well at all. The differences are unclear to me.',
    '2 — I know the labels (FT/PT/casual) but not the legal differences.',
    '3 — Limited understanding of leave, probation, and termination differences.',
    '4 — Some understanding, with gaps that could cause mistakes.',
    '5 — Solid basics; unsure on overtime, conversion, or casual entitlements.',
    '6 — Can explain most differences with some reference material.',
    '7 — Comfortable managing FT, PT and casual arrangements day to day.',
    '8 — Strong understanding including probation, leave, and ending employment.',
    '9 — Very clear across employment types and how Awards interact with them.',
    '10 — Fully aware of all material differences and apply them correctly.',
  ],
  'pay-better-off': [
    '1 — I’m not sure — we’ve never checked better-off-overall.',
    '2 — We assume above-Award pay is enough without documentation.',
    '3 — Low confidence. Flat rates / salaries haven’t been stress-tested.',
    '4 — Partial checks only on some roles.',
    '5 — We’ve looked once, but not systematically.',
    '6 — Most salaried/flat-rate roles have been reviewed informally.',
    '7 — Documented better-off checks for most affected employees.',
    '8 — Strong annual review process for flat rates and annualised salaries.',
    '9 — Very confident — written comparisons kept on file.',
    '10 — We review annually and are confident employees are better off overall.',
  ],
  'ai-clarity': [
    '1 — No shared view. People use whatever tools they find.',
    '2 — I’ve noticed some AI use, but we haven’t discussed it as a business.',
    '3 — Limited clarity — a few people experiment with no common rules.',
    '4 — We’ve talked once or twice; nothing is agreed.',
    '5 — Basic awareness of where AI shows up, with big gaps.',
    '6 — Most people know the main approved uses, informally.',
    '7 — Clear enough for day-to-day work; edge cases still fuzzy.',
    '8 — Documented view of where AI is used in people work.',
    '9 — Strong shared clarity — approved uses and off-limits are understood.',
    '10 — Fully clear. Approved uses, owners, and review habits are in place.',
  ],
  'ai-people-decisions': CONFIDENCE_STEPS,
  'ai-capability': PRACTICE_STEPS,
}

export function scaleWithSteps(
  minLabel: string,
  maxLabel: string,
  steps: string[] = FAMILIARITY_STEPS,
): ScaleConfig {
  return {
    min: 1,
    max: 10,
    minLabel,
    maxLabel,
    stepLabels: steps,
  }
}

export function stepsForQuestion(id: string, fallback: string[] = FAMILIARITY_STEPS): string[] {
  return OVERRIDES[id] ?? fallback
}
