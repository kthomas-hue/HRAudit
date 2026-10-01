import { categories, feedbackQuestion, questions, type Question } from '../data/questions'
import {
  CONFIDENCE_STEPS,
  FAMILIARITY_STEPS,
  PRACTICE_STEPS,
  stepsForQuestion,
} from '../data/scalePresets'
import type { CategoryGuidance, ContentPack, ResourceLink, SiteSettings } from './types'

function ds(
  id: string,
  label: string,
  path: string,
  description: string,
): ResourceLink {
  return {
    id,
    label,
    url: `https://dreamstonehr.com.au/blog/resource/${path}/`,
    description,
    source: 'dreamstone',
  }
}

function ext(id: string, label: string, url: string, description: string): ResourceLink {
  return { id, label, url, description, source: 'external' }
}

function enrichQuestions(raw: Question[]): Question[] {
  return raw.map((q) => {
    if (q.type !== 'scale' || !q.scale) return q
    const fallback =
      q.id.includes('recruit') || q.id.includes('policies-followed') || q.id.includes('culture')
        ? PRACTICE_STEPS
        : q.id.includes('confident') ||
            q.id.includes('classification') ||
            q.id.includes('better-off') ||
            q.id.includes('plsl') ||
            q.id.includes('records') ||
            q.id.includes('exits') ||
            q.id.includes('whs-claim')
          ? CONFIDENCE_STEPS
          : FAMILIARITY_STEPS
    return {
      ...q,
      scale: {
        ...q.scale,
        stepLabels: q.scale.stepLabels?.length ? q.scale.stepLabels : stepsForQuestion(q.id, fallback),
      },
    }
  })
}

const baseGuidance: Record<string, CategoryGuidance> = {
  pay: {
    categoryId: 'pay',
    stakes: 'Correct pay, awards, and entitlements are non-negotiable under Fair Work.',
    riskIfWeak:
      'Underpayment exposure, Fair Work claims, back-pay liability, and credibility damage with your team.',
    nextMove:
      'Commission a pay & award spot-check on your highest-risk roles (casuals, flat-rate, annualised salary).',
    partnerAngle: 'Award mapping, better-off-overall checks, and payroll controls that stick.',
    reportDetail:
      'Leaders often assume “we pay above the Award” is enough. It isn’t. Classification errors, missing allowances, weak annualised-salary documentation, and payslip gaps are common sources of underpayment risk as teams grow.\n\nA paid leadership report should leave you with a clear map: which roles sit under which Award, whether flat rates and salaries are genuinely better off overall, and whether payroll controls would survive a Fair Work review. Treat this section as an audit of systems — not a gut feel score.',
    actions: [
      { id: 'pay-1', title: 'Map roles to Awards', detail: 'List each role, confirm Modern Award + classification/level, and flag any “off Award” assumptions. Assign an owner for gaps.', timeframe: 'This week' },
      { id: 'pay-2', title: 'Run a better-off-overall check', detail: 'For flat-rate and salaried staff, compare Award entitlements vs what you actually pay — in writing — and keep the comparison on file.', timeframe: '30 days' },
      { id: 'pay-3', title: 'Tighten payslip & timesheet controls', detail: 'Confirm payslips separate base, overtime, penalties and allowances, and that records are retained for at least 7 years.', timeframe: '30 days' },
      { id: 'pay-4', title: 'Schedule an annual Award / NES review', detail: 'Put a recurring leadership calendar item to re-check classifications, NES application, and casual conversion risks.', timeframe: '90 days' },
    ],
    resources: [
      ds('pay-ds1', 'DreamStoneHR — Resources hub', 'hr-health-check', 'Browse DreamStoneHR practical tools and downloads for employers.'),
      ext('pay-r1', 'Fair Work Ombudsman — Awards', 'https://www.fairwork.gov.au/awards-and-agreements/awards', 'Find and check Modern Awards relevant to your workforce.'),
      ext('pay-r2', 'National Employment Standards', 'https://www.fairwork.gov.au/employment-conditions/national-employment-standards-nes', 'The 11 minimum standards that apply to most employees.'),
      ext('pay-r3', 'Pay & conditions tools', 'https://calculate.fairwork.gov.au/', 'Fair Work pay calculator for rates and entitlements.'),
      ext('pay-r4', 'DreamStoneHR blogs', 'https://dreamstonehr.com.au/blogs/', 'Practical commentary for leaders navigating workplace obligations.'),
    ],
  },
  contracts: {
    categoryId: 'contracts',
    stakes: 'Contracts and position descriptions set the legal baseline for every employment relationship.',
    riskIfWeak: 'Disputes over hours, duties, IP, restraint, and termination become harder and more expensive to resolve.',
    nextMove: 'Audit whether every employee has a current agreement plus FWIS/CEIS, and close gaps within 30 days.',
    partnerAngle: 'Contract templates, variation letters, and documentation that actually protect you.',
    reportDetail: 'Missing or outdated contracts, incomplete clauses, and absent Fair Work / Casual Information Statements create avoidable exposure. Position descriptions that don’t match reality also undermine performance management later.\n\nYour action plan should create coverage (everyone has a signed current agreement), completeness (clauses that actually protect you), and alignment (PDs match the work and Award classification).',
    actions: [
      { id: 'con-1', title: 'Contract coverage audit', detail: 'Confirm every employee has a signed current agreement and that FWIS/CEIS was issued.', timeframe: 'This week' },
      { id: 'con-2', title: 'Clause completeness check', detail: 'Review templates for Award, hours, pay, probation, leave, notice, IP, confidentiality, and behaviour standards.', timeframe: '30 days' },
      { id: 'con-3', title: 'Align position descriptions', detail: 'Update PDs so duties, reporting lines and Award classifications match the roles you actually need.', timeframe: '90 days' },
    ],
    resources: [
      ext('con-r1', 'Fair Work Information Statement', 'https://www.fairwork.gov.au/employment-conditions/national-employment-standards-nes/fair-work-information-statement', 'Must be given to new employees.'),
      ext('con-r2', 'Casual Employment Information Statement', 'https://www.fairwork.gov.au/employment-conditions/national-employment-standards-nes/casual-employment-information-statement', 'Required for casual employees.'),
      ds('con-ds1', 'DreamStoneHR Recruitment Toolkit', 'recruitment-toolkit', 'Templates for job descriptions, ads, interviews and reference checks — useful when contracts and PDs need to align.'),
    ],
  },
  recruitment: {
    categoryId: 'recruitment',
    stakes: 'Hiring quality and process fairness affect both performance and discrimination risk.',
    riskIfWeak: 'Poor cultural/role fit, inconsistent shortlisting, and interview questions that create legal exposure.',
    nextMove: 'Standardise interview questions against the position description and keep shortlisting notes on file.',
    partnerAngle: 'Practical recruitment process design your managers can actually follow.',
    reportDetail: 'Inconsistent hiring processes create both commercial waste (bad hires) and legal risk (discriminatory questions, weak records). A repeatable process protects candidates and your business.\n\nUse your score as a prompt to install structure: role criteria before advertising, the same core interview questions, documented notes, and a clean close-the-loop with unsuccessful candidates.',
    actions: [
      { id: 'rec-1', title: 'Standardise interviews', detail: 'Same core questions for each role, tied to essential criteria in the PD.', timeframe: 'This week' },
      { id: 'rec-2', title: 'Close the loop with candidates', detail: 'Email non-interviewed applicants; phone unsuccessful shortlisted candidates.', timeframe: '30 days' },
      { id: 'rec-3', title: 'Keep interview records', detail: 'Collect interviewer notes and store them with the recruitment file.', timeframe: '30 days' },
    ],
    resources: [
      ds('rec-ds1', 'DreamStoneHR Recruitment Toolkit', 'recruitment-toolkit', 'End-to-end hiring toolkit with editable templates for PDs, ads, interviews and reference checks.'),
      ext('rec-r1', 'Hiring employees — Fair Work', 'https://www.fairwork.gov.au/hiring', 'Obligations when recruiting and engaging staff.'),
    ],
  },
  onboarding: {
    categoryId: 'onboarding',
    stakes: 'The first weeks decide safety, productivity, and whether people stay.',
    riskIfWeak: 'New starters miss critical policies, work-rights checks, and expectations — creating early risk and churn.',
    nextMove: 'Build a 5-day onboarding checklist covering WHS, conduct, systems, and role clarity — and assign an owner.',
    partnerAngle: 'Onboarding that is compliant, human, and repeatable as you grow.',
    reportDetail: 'Onboarding is where compliance and culture meet. Missing work-rights checks, WHS inductions, or policy acknowledgements creates early exposure — and a poor first impression that drives turnover.\n\nPair onboarding with probation discipline: if you don’t review early, you lose the most useful window to decide fit.',
    actions: [
      { id: 'onb-1', title: 'Create a 5-day checklist', detail: 'Cover WHS, bullying/harassment, policies, hours, systems, and introductions.', timeframe: 'This week' },
      { id: 'onb-2', title: 'Verify work rights', detail: 'Confirm visa/work-rights checks for non-citizens before or on commencement.', timeframe: 'This week' },
      { id: 'onb-3', title: 'Assign an onboarding owner', detail: 'Name who is accountable for each new starter’s first fortnight.', timeframe: '30 days' },
    ],
    resources: [
      ds('onb-ds1', 'DreamStoneHR Probation Review Checklist', 'probation-review-checklist-employers', 'Practical probation timing, decision checks, and how to use the 5-month review point.'),
      ext('onb-r1', 'Visa Entitlement Verification Online (VEVO)', 'https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online', 'Check work rights for visa holders.'),
    ],
  },
  policies: {
    categoryId: 'policies',
    stakes: 'Policies only work if people can find them, understand them, and leaders enforce them.',
    riskIfWeak: 'Inconsistent management decisions, weak defence in claims, and culture that drifts from what you say you stand for.',
    nextMove: 'Confirm your handbook covers conduct, complaints, WHS, and leave — then get written acknowledgement from all staff.',
    partnerAngle: 'A living handbook, not a PDF that sits unread.',
    reportDetail: 'A handbook that isn’t acknowledged or enforced is little protection. Leaders need accessible, current policies — and managers who apply them consistently.\n\nFocus on the policies that attract claims first: conduct, complaints/grievance, WHS, leave, and respectful workplaces / sexual harassment response.',
    actions: [
      { id: 'pol-1', title: 'Handbook gap review', detail: 'Check coverage for conduct, complaints, WHS, leave, social media, and IT use.', timeframe: '30 days' },
      { id: 'pol-2', title: 'Get acknowledgements', detail: 'Collect written acceptance of current policies (and re-acknowledge on material changes).', timeframe: '30 days' },
      { id: 'pol-3', title: 'Manager briefing', detail: 'Walk managers through how and when to apply key policies.', timeframe: '90 days' },
    ],
    resources: [
      ds('pol-ds1', 'Respect@Work Readiness Check', 'respectwork-a-readiness-check-for-employers', 'DreamStoneHR self-reflection tool for respectful workplace expectations and positive duty readiness.'),
      ext('pol-r1', 'Managing underperformance — Fair Work', 'https://www.fairwork.gov.au/tools-and-resources/best-practice-guides/managing-underperformance', 'Practical guidance that often sits alongside policy frameworks.'),
      ext('pol-r2', 'DreamStoneHR resources library', 'https://dreamstonehr.com.au/our-resources/', 'Templates and practical downloads for employers.'),
    ],
  },
  whs: {
    categoryId: 'whs',
    stakes: 'Workers compensation, first aid, and emergency readiness are leadership accountabilities.',
    riskIfWeak: 'Injury response failures, regulator scrutiny, and preventable harm to people you are responsible for.',
    nextMove: 'Verify insurance is current, first-aid coverage is adequate, and evacuation procedures are practised.',
    partnerAngle: 'WHS practicality for growing workplaces — not just a policy binder.',
    reportDetail: 'WHS failure is both a human and commercial risk. Insurance gaps, untrained first aiders, and untested evacuation plans are common in growing businesses that have outpaced their systems.\n\nYour plan should cover prevention (induction, hazards), response (injury, evacuation), and recovery (return to work / reasonable adjustments).',
    actions: [
      { id: 'whs-1', title: 'Confirm workers compensation cover', detail: 'Check policy currency and that headcount/payroll declarations are accurate.', timeframe: 'This week' },
      { id: 'whs-2', title: 'First aid & evacuation check', detail: 'Confirm trained people on site and that evacuation procedures are known and practised.', timeframe: '30 days' },
      { id: 'whs-3', title: 'Injury response playbook', detail: 'Document what happens after an injury — including return-to-work and reasonable adjustments.', timeframe: '90 days' },
    ],
    resources: [
      ext('whs-r1', 'Safe Work Australia', 'https://www.safeworkaustralia.gov.au/', 'National WHS guidance and resources.'),
      ext('whs-r2', 'DreamStoneHR blogs — health, safety & wellness', 'https://dreamstonehr.com.au/blogs/', 'Practical leadership articles on workplace risk and wellbeing.'),
    ],
  },
  performance: {
    categoryId: 'performance',
    stakes: 'How you manage performance and conduct determines fairness, retention, and claim risk.',
    riskIfWeak: 'Issues drag on, managers avoid conversations, and exits become messy unfair-dismissal territory.',
    nextMove: 'Put a simple documented review + PIP pathway in place, and brief managers on when to escalate.',
    partnerAngle: 'Manager coaching and process that is fair, clear, and defensible.',
    reportDetail: 'Avoided conversations become legal problems. A clear, documented pathway for performance and conduct protects fairness for employees and defensibility for the business.\n\nConnect probation, regular reviews, PIP steps, and serious misconduct pathways so managers know what “good process” looks like before they need it.',
    actions: [
      { id: 'perf-1', title: 'Define your PIP pathway', detail: 'Simple steps, templates, and when HR/leadership must be involved.', timeframe: '30 days' },
      { id: 'perf-2', title: 'Schedule formal reviews', detail: 'Put recurring documented reviews in the calendar for all staff.', timeframe: '30 days' },
      { id: 'perf-3', title: 'Manager conversation training', detail: 'Practice conduct and performance conversations before they are urgent.', timeframe: '90 days' },
    ],
    resources: [
      ds('perf-ds1', 'Performance Review Template', 'performance-review-template', 'Structured DreamStoneHR template covering performance, behaviour, goals and development.'),
      ds('perf-ds2', 'Employee Goal Setting Template', 'employee-goal-setting-template', 'Clear measurable goals with timelines, support and review points.'),
      ds('perf-ds3', 'Probation Review Checklist', 'probation-review-checklist-employers', 'Decision framework before probation ends.'),
      ext('perf-r1', 'Managing underperformance', 'https://www.fairwork.gov.au/tools-and-resources/best-practice-guides/managing-underperformance', 'Fair Work best practice guide.'),
    ],
  },
  training: {
    categoryId: 'training',
    stakes: 'Capability and awareness campaigns reduce both skill gaps and psychosocial risk.',
    riskIfWeak: 'Stagnant teams, weak succession, and missed signals on safety, mental health, and respectful workplaces.',
    nextMove: 'Pick one capability priority and one awareness campaign this quarter — then measure completion.',
    partnerAngle: 'Targeted training that supports compliance and culture, not random courses.',
    reportDetail: 'Training is often ad hoc after onboarding. Leaders who invest in capability and awareness (RUOK?, respectful workplaces, Safe Work Month) reduce both skill risk and psychosocial exposure.\n\nTie training to role pathways and positive duty — not one-off courses with no follow-through.',
    actions: [
      { id: 'trn-1', title: 'Choose one capability priority', detail: 'Pick a skill theme tied to succession or business growth this quarter.', timeframe: 'This week' },
      { id: 'trn-2', title: 'Schedule one awareness campaign', detail: 'RUOK?, Mental Health Week, Domestic Violence Awareness, or Safe Work Month — with participation tracking.', timeframe: '30 days' },
      { id: 'trn-3', title: 'Link training to role pathways', detail: 'Connect development to position descriptions and succession planning.', timeframe: '90 days' },
    ],
    resources: [
      ds('trn-ds1', 'Respect@Work Readiness Check', 'respectwork-a-readiness-check-for-employers', 'Reflect on respectful workplace foundations before issues escalate.'),
      ext('trn-r1', 'R U OK?', 'https://www.ruok.org.au/', 'Workplace conversation and campaign resources.'),
    ],
  },
  culture: {
    categoryId: 'culture',
    stakes: 'Engagement, recognition, and competitive pay shape whether good people stay.',
    riskIfWeak: 'Quiet quitting, rising turnover costs, and a workplace that feels transactional instead of purposeful.',
    nextMove: 'Review turnover reasons for the last 12 months and set one retention action you can fund this quarter.',
    partnerAngle: 'Culture work that connects wellbeing, leadership, and commercial outcomes.',
    reportDetail: 'Culture shows up in turnover, recognition, and whether people feel invested in. Leaders who only manage compliance miss the commercial cost of disengagement.\n\nUse DreamStoneHR culture tools to move from vague “we’ve got a great culture” claims to observable leadership habits.',
    actions: [
      { id: 'cul-1', title: 'Turnover review', detail: 'Look at exits in the last 12 months — reasons, tenure, and replaceability.', timeframe: 'This week' },
      { id: 'cul-2', title: 'Fund one retention action', detail: 'Recognition rhythm, wellbeing initiative, or pay review — pick one and own it.', timeframe: '30 days' },
      { id: 'cul-3', title: 'Pulse engagement', detail: 'Run a short pulse check and share results with the team.', timeframe: '90 days' },
    ],
    resources: [
      ds('cul-ds1', 'Workplace Culture Challenge', 'workplace-culture-challenge', 'Yes/no leadership self-check across hiring, onboarding, performance and cultural accountability.'),
      ds('cul-ds2', '10 Tips to Improve Workplace Culture', 'improve-your-workplace-culture', 'Practical everyday leadership actions that shape culture.'),
      ext('cul-r1', 'Workplace wellbeing', 'https://www.comcare.gov.au/safe-healthy-work/healthy-workplace', 'Practical wellbeing guidance for workplaces.'),
    ],
  },
  records: {
    categoryId: 'records',
    stakes: 'Complete records are your evidence trail for pay, leave, variations, and claims.',
    riskIfWeak: 'You cannot prove compliance when challenged — and resolving disputes takes longer and costs more.',
    nextMove: 'Confirm employee files hold contracts, leave, variations, and licences — and that records are retained for 7 years.',
    partnerAngle: 'Record-keeping systems that survive audits and investigations.',
    reportDetail: 'When a claim arrives, records are your defence. Incomplete files on deductions, leave, variations, or licences turn manageable issues into expensive ones.\n\nSpot-check files now — don’t wait for a request from Fair Work, a lawyer, or an injured worker.',
    actions: [
      { id: 'rec2-1', title: 'File completeness spot-check', detail: 'Sample 10 employee files for contracts, leave, variations, and licences.', timeframe: 'This week' },
      { id: 'rec2-2', title: 'Set retention rules', detail: 'Confirm 7-year retention and who owns archiving.', timeframe: '30 days' },
      { id: 'rec2-3', title: 'Employee self-service for leave', detail: 'Make leave balances accessible so records stay current and trusted.', timeframe: '90 days' },
    ],
    resources: [
      ext('rec2-r1', 'Record-keeping obligations', 'https://www.fairwork.gov.au/pay-and-hours/record-keeping-and-pay-slips', 'Fair Work requirements for records and payslips.'),
    ],
  },
  exits: {
    categoryId: 'exits',
    stakes: 'Terminations, redundancy, and consultation are high-stakes moments for risk and reputation.',
    riskIfWeak: 'Unfair dismissal / adverse action claims, messy handovers, and avoidable Fair Work exposure.',
    nextMove: 'Document your exit checklist (notice, final pay, property, consultation) and rehearse it with leadership.',
    partnerAngle: 'Safe exits — when ending employment is necessary, do it properly.',
    reportDetail: 'Exits are where process failures become claims. Notice, consultation, genuine redundancy, and Small Business Fair Dismissal Code understanding all matter — before you need them.\n\nBuild the checklist while calm. Rehearse unfair dismissal vs adverse action differences with decision-makers.',
    actions: [
      { id: 'ex-1', title: 'Build an exit checklist', detail: 'Notice, final pay, property, access removal, consultation notes, and references.', timeframe: 'This week' },
      { id: 'ex-2', title: 'Brief leadership on unfair dismissal vs adverse action', detail: 'Make sure decision-makers know the difference before a termination decision.', timeframe: '30 days' },
      { id: 'ex-3', title: 'Redundancy / consultation playbook', detail: 'Document how you consult on major change and assess genuine redundancy.', timeframe: '90 days' },
    ],
    resources: [
      ext('ex-r1', 'Ending employment', 'https://www.fairwork.gov.au/ending-employment', 'Fair Work guidance on resignations, dismissals and redundancy.'),
      ext('ex-r2', 'Small Business Fair Dismissal Code', 'https://www.fairwork.gov.au/ending-employment/unfair-dismissal/small-business-fair-dismissal-code', 'For businesses with fewer than 15 employees.'),
    ],
  },
  psychosocial: {
    categoryId: 'psychosocial',
    stakes: 'Positive duty, sexual harassment response, FDV leave, and mental health are now front-line leadership risks.',
    riskIfWeak: 'Regulatory scrutiny, serious claims, and a culture where people do not feel safe to speak up.',
    nextMove: 'Confirm you have a clear sexual harassment response pathway, EAP access, and trained managers for first response.',
    partnerAngle: 'Psychosocial risk and positive duty — practical compliance with a people-first lens.',
    reportDetail: 'Positive duty and psychosocial risk have changed the standard. Leaders need response pathways for sexual harassment, FDV leave literacy, EAP access, and managers who can handle first-response conversations.\n\nThis is not a policy-only problem. Your report actions should make reporting safe, response clear, and prevention visible.',
    actions: [
      { id: 'psy-1', title: 'Sexual harassment response pathway', detail: 'Document who receives reports, how investigations work, and how people are protected from victimisation.', timeframe: 'This week' },
      { id: 'psy-2', title: 'Confirm EAP + manager first aid', detail: 'Ensure EAP access is communicated and key managers have mental health first-aid capability.', timeframe: '30 days' },
      { id: 'psy-3', title: 'FDV leave & support briefing', detail: 'Brief leaders on Family and Domestic Violence Leave and practical support options.', timeframe: '30 days' },
    ],
    resources: [
      ds('psy-ds1', 'Respect@Work Readiness Check', 'respectwork-a-readiness-check-for-employers', 'DreamStoneHR readiness reflection for respectful workplaces and positive duty.'),
      ext('psy-r1', 'Positive duty — AHRC', 'https://humanrights.gov.au/our-work/sex-discrimination/projects/positive-duty-under-sex-discrimination-act', 'Employer positive duty to prevent sexual harassment.'),
      ext('psy-r2', 'Family & domestic violence leave', 'https://www.fairwork.gov.au/leave/family-and-domestic-violence-leave', 'NES entitlements and employer obligations.'),
      ext('psy-r3', 'Psychosocial hazards — Safe Work', 'https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/mental-health', 'Managing psychosocial risks at work.'),
    ],
  },
}

const defaultSettings: SiteSettings = {
  productName: 'HR Health Check',
  tagline: 'A leadership self-audit for owners, GMs & CEOs',
  landingHeadline: 'Know where your HR is exposed',
  landingLead:
    'This is a structured self-audit — not a quick quiz. In about 20 minutes you’ll pressure-test your people foundations and walk away with a leadership report, timed action plan, and resources worth acting on.',
  reportTitle: 'Your leadership report',
  contactEmail: 'info@dreamstonehr.com.au',
  contactPhone: '(02) 8320 9320',
  websiteUrl: 'https://www.dreamstonehr.com.au',
  privacyUrl: 'https://www.dreamstonehr.com.au',
  adminPassword: 'dreamstone',
  partnerCtaLabel: 'Email this report to DreamStoneHR',
}

export function createDefaultContentPack(): ContentPack {
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    settings: defaultSettings,
    categories: structuredClone(categories),
    questions: enrichQuestions(structuredClone(questions)),
    feedbackPrompt: feedbackQuestion.prompt,
    feedbackPlaceholder: feedbackQuestion.placeholder ?? '',
    guidance: structuredClone(baseGuidance),
  }
}
