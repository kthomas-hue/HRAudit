import type { StateId } from "./content"
import type { Band } from "./model"

export type ResourceLink = {
  title: string
  href: string
  source: string
}

export type BandCopy = {
  reading: string
  impact: string
  keep: string[]
}

const fairWork = "Fair Work Ombudsman"
const ato = "Australian Taxation Office"
const swa = "Safe Work Australia"
const ahrc = "Australian Human Rights Commission"
const homeAffairs = "Department of Home Affairs"
const ours = "DreamStoneHR"

export const SECTION_COPY: Record<string, Record<Exclude<Band, "not-applicable">, BandCopy>> = {
  pay: {
    low: {
      reading:
        "Pay is the area most likely to become an underpayment. A rate that feels fair, a flat salary, or a payslip that bundles everything together does not show that the award, the penalties and the super were actually met.",
      impact:
        "Mapping the award and checking one real pay period is the fastest way to see whether you are ahead of the award or quietly behind it.",
      keep: [],
    },
    medium: {
      reading:
        "The base of pay is partly in place. The usual miss at this level is not the hourly rate. It is a penalty, an allowance, a salary that was never reconciled, or super that is still running on the old quarterly habit.",
      impact:
        "Closing the specific gap below stops a small miss repeating on every pay run.",
      keep: [],
    },
    high: {
      reading:
        "On these answers, pay is being treated as a system rather than a feeling. The award is mapped, the extra conditions are not assumed away, and the payslip can be read.",
      impact:
        "The value now is keeping the check alive when a role, a roster or the annual wage review changes.",
      keep: [
        "When a role changes, update the classification in the same week, and recheck any salary against a real pay period after each annual wage review.",
      ],
    },
  },
  contracts: {
    low: {
      reading:
        "The agreement people are working under is thin or missing. That is where arguments about status, hours, notice and pay begin, because there is nothing written that matches the job they are actually doing.",
      impact:
        "A current contract, plus the Fair Work statements, gives you a document you can point to before a dispute writes the story for you.",
      keep: [],
    },
    medium: {
      reading:
        "Most people have something in writing. The risk is the contract that describes an old job, the statement that sometimes goes out, or a contractor arrangement that has never been tested.",
      impact:
        "Fixing the mismatch now is cheaper than explaining it after hours, status or notice are already in dispute.",
      keep: [],
    },
    high: {
      reading:
        "Contracts look current, the required statements go out, and contractor arrangements have been looked at rather than labelled and left.",
      impact: "The habit to protect is issuing a variation in the same week the work changes.",
      keep: ["When hours, duties or reporting lines change, issue a short variation in the same week and keep it with the contract."],
    },
  },
  recruitment: {
    low: {
      reading:
        "Hiring is happening without a clear description of the role. That makes the award level harder to get right, and it makes a poor hire harder to manage, because the job was never written down.",
      impact:
        "A short position description, used for the ad and the interview, is the piece that makes the next hire fairer and easier to defend.",
      keep: [],
    },
    medium: {
      reading:
        "Some of the hiring process is deliberate. The gap is consistency: a description that is out of date, an ad written from scratch, or an interview that depends on who is free.",
      impact: "Using one description for the ad, the interview and the award level removes the drift between them.",
      keep: [],
    },
    high: {
      reading:
        "Roles are described before they are advertised, and the interview is consistent enough that you could explain why one person was hired and another was not.",
      impact: "Review the position description when the work changes, not only when you next recruit.",
      keep: ["When the work in a role changes, update the position description and the award classification together."],
    },
  },
  onboarding: {
    low: {
      reading:
        "The first week is being left to whoever is on the tools. Safety, the rules, the hours and the employment type are then picked up by habit, which is how a gap becomes the way the business runs.",
      impact:
        "One first-week list, used for every hire, is enough to make the start the same no matter who is rostered on.",
      keep: [],
    },
    medium: {
      reading:
        "New people get some of the start right, and some of it depends on the day. Casual conversion, visa expiry or the induction are the items that slip when nobody owns the list.",
      impact: "Writing the missing step onto the same list means the next hire does not rely on memory.",
      keep: [],
    },
    high: {
      reading:
        "The first week looks organised: induction, the statements, and the checks that apply to casuals or visa holders are not left to chance.",
      impact: "Keep using the same list, and tick it, including for someone who starts in a hurry.",
      keep: ["Use the same first-week list for every hire, including the one who starts on a busy day."],
    },
  },
  policies: {
    low: {
        reading:
          "There is no current set of rules people can find. A policy is not compulsory in itself, but without one you are explaining what you meant, rather than showing what the person was given.",
        impact:
          "Start with a short set: a code of conduct, bullying and harassment, how a grievance is raised, and the leave people actually take, including personal, annual, parental, and family and domestic violence leave.",
      keep: [],
    },
    medium: {
      reading:
        "Something exists, and it is not yet reliable. It may be old, unacknowledged after a change, or applied by some managers and ignored by others.",
      impact:
        "A rule people have seen, and that managers actually use, is the version that helps you. The folder on its own does not.",
      keep: [],
    },
    high: {
      reading:
        "Policies are current, people have acknowledged them, and managers apply them. That is the difference between a document and a workplace rule.",
      impact: "When a policy changes, say what changed in plain words and ask people to acknowledge that version.",
      keep: ["On the next change, tell people what changed and keep their acknowledgement with the policy."],
    },
  },
  safety: {
    low: {
      reading:
        "The physical safety basics are not in place. Workers compensation, a written way out of the building, and someone who can give first aid are the items that matter on the day, not after it.",
      impact:
        "Confirming the insurance and writing the evacuation route are the two steps that change this from a hope into a plan.",
      keep: [],
    },
    medium: {
      reading:
        "Some of the safety system is there. The exposure is the missing piece: insurance without a return-to-work path, an evacuation that lives in someone's head, or first aid that fails when one person is away.",
      impact: "Close that single gap before the next certificate expires or the next person is hurt.",
      keep: [],
    },
    high: {
      reading:
        "Insurance, the emergency plan and first-aid cover look organised for the way this workplace actually runs.",
      impact: "Walk the evacuation route twice a year, and replace first-aid training before it expires.",
      keep: ["Diary the next evacuation walk and the next first-aid expiry, and treat both as ordinary maintenance."],
    },
  },
  performance: {
    low: {
      reading:
        "Performance and conduct are not being dealt with while they are small. A later dismissal then looks like a surprise, which is the version that is hardest to explain.",
      impact:
        "One written conversation — the gap, the standard, and the date you will look again — is a fairer process than months of silence.",
      keep: [],
    },
    medium: {
      reading:
        "Some managers raise issues, and the record is patchy. Reviews that are not written down, or a conduct problem that depends on who the manager is, will not help you later.",
      impact: "Use the same short note for every conversation you are already having, so the process is visible.",
      keep: [],
    },
    high: {
      reading:
        "Reviews happen, slippage has a fair process, and conduct is handled against a standard rather than a mood.",
      impact: "Keep the note: what was said, what better looks like, and when you will look again.",
      keep: ["After each review or conduct conversation, file the note the same day, including the date you will check again."],
    },
  },
  training: {
    low: {
      reading:
        "Learning is stopping once someone can do the basics, and the rules around probation or pay reviews are not being used. The business then depends on a few people, and pay drifts away from the work.",
      impact:
        "One skill the business will need this year, and a probation review before the date rather than after it, are the two places to start.",
      keep: [],
    },
    medium: {
      reading:
        "Training happens when something forces it — a new system, or an award increase — and not as a habit. Probation or the annual look at what the job has become is the part still sitting idle.",
      impact: "Put the missing review in the diary. A date is what turns a good intention into a decision.",
      keep: [],
    },
    high: {
      reading:
        "People keep learning after they start, probation is reviewed before it ends, and pay is looked at against the work, not only against the award floor.",
      impact: "Tie one development action to each performance review so training does not depend on a crisis.",
      keep: ["At the next review, name one skill the person is building and who else in the business can already do it."],
    },
  },
  culture: {
    low: {
      reading:
        "The business is losing people, or would be caught out by a major change, without a clear view of why. Recruiting harder does not fix a pattern you have not named.",
      impact:
        "Ask why the last few people left, and name one thing in the work — hours, staffing, or how managers speak — that you will change.",
      keep: [],
    },
    medium: {
      reading:
        "Culture is partly tended. The miss is usually that wellbeing is a social event, departures are not examined, or people are told about a change after it has been decided.",
      impact: "One change to the work itself, or one real consultation before a decision is locked, is worth more than another event.",
      keep: [],
    },
    high: {
      reading:
        "You can explain why people stay or leave, the work is part of how you look after people, and major change is discussed before it is final.",
      impact: "Keep asking, in an ordinary meeting, what in the work is wearing people down, and change one thing.",
      keep: ["Once a quarter, ask what in the work is wearing people down and change one of the answers."],
    },
  },
  records: {
    low: {
      reading:
        "You would struggle to produce a complete employee file this week. Proper records are a legal obligation, and they are also what you need if a pay, leave or dismissal question is later put to the Fair Work Ombudsman. If the record is missing, the conversation starts in the employee's favour.",
      impact:
        "A single place for the contract, the hours, the leave and any deduction approval is the system. Searching an inbox is not.",
      keep: [],
    },
    medium: {
      reading:
        "Some records are kept, and the set is not yet one you would want to hand over. Leavers, breaks, long service leave or a slow search are the usual holes at this level.",
      impact:
        "Fix the filing before you add another policy. A record you can find is what makes the rest of this review real.",
      keep: [],
    },
    high: {
      reading:
        "You could produce the core records, including for people who have left, and leave is being tracked past annual leave alone.",
      impact:
        "Once a quarter, open one current file and one leaver's file and check the contract, the hours and the leave are still there.",
      keep: ["Once a quarter, test one current file and one leaver's file against the 7-year record-keeping rule."],
    },
  },
  exits: {
    low: {
      reading:
        "People are leaving without a settled process. Final pay, notice, the reason, and a fair path through redundancy or dismissal are where claims start, and an informal goodbye does not create a record.",
      impact:
        "A last-pay checklist on the next exit — resignation included — is the piece that makes the ending consistent.",
      keep: [],
    },
    medium: {
      reading:
        "Exits are partly handled. Pay may go out while the reason, the consultation, or the difference between an unfair dismissal and a general protections claim is still thin.",
      impact:
        "Write the reason and the steps before the next ending, not after someone has already left.",
      keep: [],
    },
    high: {
      reading:
        "Exits are being managed: notice and final pay are organised, redundancy is understood as a job that has gone, and dismissal follows a process you can show.",
      impact: "Keep the checklist, including for a resignation that feels friendly and simple.",
      keep: ["Run the exit checklist on every departure, including the resignation that does not feel risky."],
    },
  },
  psychosocial: {
    low: {
      reading:
        "Psychosocial risk and the positive duty are not yet in practice. The duty is to take reasonable and proportionate steps to prevent harm — sexual harassment, bullying, hostility, crushing workload — not only to respond after a complaint.",
      impact:
        "Naming the hazards in this workplace, and giving people a reporting path that does not run through the person complained about, is the start that regulators expect to see.",
      keep: [],
    },
    medium: {
      reading:
        "You have started. Policies or good intentions are ahead of a consistent practice, and prevention still depends on the leader or waits for a complaint.",
      impact:
        "Make the same standard apply in every team: what the hazards are, how to report, and what a manager does in the first conversation.",
      keep: [],
    },
    high: {
      reading:
        "This looks proactive. Hazards have been named, reporting does not depend on one person, and managers know how to respond to harm, including family and domestic violence leave.",
      impact:
        "Review the hazards when the business changes — a restructure, growth, or a run of pressure — so the controls stay real.",
      keep: [
        "When hours, structure or customer pressure change, ask what new psychosocial risk that creates and write the control you will use.",
      ],
    },
  },
}

export const SECTION_LINKS: Record<string, ResourceLink[]> = {
  pay: [
    {
      title: "Pay and wages, including awards, penalties and allowances",
      href: "https://www.fairwork.gov.au/pay-and-wages",
      source: fairWork,
    },
    {
      title: "Pay and Conditions Tool",
      href: "https://calculate.fairwork.gov.au/",
      source: fairWork,
    },
    {
      title: "Summary of the National Employment Standards",
      href: "https://dreamstonehr.com.au/blog/resource/summary-of-the-national-employment-standards/",
      source: ours,
    },
  ],
  contracts: [
    {
      title: "Employment Contract Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/employment-contract-checklist-3/",
      source: ours,
    },
    {
      title: "Annualised salaries: what to check and record",
      href: "https://dreamstonehr.com.au/blog/annualised-salary/",
      source: ours,
    },
    {
      title: "Types of employees",
      href: "https://www.fairwork.gov.au/starting-employment/types-of-employees",
      source: fairWork,
    },
    {
      title: "Summary of the National Employment Standards",
      href: "https://dreamstonehr.com.au/blog/resource/summary-of-the-national-employment-standards/",
      source: ours,
    },
  ],
  recruitment: [
    {
      title: "Recruitment Toolkit, including position descriptions, ads and interviews",
      href: "https://dreamstonehr.com.au/blog/resource/recruitment-toolkit/",
      source: ours,
    },
    {
      title: "Best practice guides",
      href: "https://www.fairwork.gov.au/tools-and-resources/best-practice-guides",
      source: fairWork,
    },
  ],
  onboarding: [
    {
      title: "Employee Onboarding Toolkit",
      href: "https://dreamstonehr.com.au/blog/resource/employee-onboarding-toolkit/",
      source: ours,
    },
    {
      title: "Probation Review Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/probation-review-checklist-employers/",
      source: ours,
    },
    {
      title: "Starting employment",
      href: "https://www.fairwork.gov.au/starting-employment",
      source: fairWork,
    },
    {
      title: "Fair Work Information Statement",
      href: "https://www.fairwork.gov.au/employment-conditions/national-employment-standards/fair-work-information-statement",
      source: fairWork,
    },
  ],
  policies: [
    {
      title: "Respectful workplaces: conduct, bullying and harassment",
      href: "https://dreamstonehr.com.au/blog/resource/respectful-workplaces-what-every-employer-needs-to-understand/",
      source: ours,
    },
    {
      title: "Summary of the National Employment Standards",
      href: "https://dreamstonehr.com.au/blog/resource/summary-of-the-national-employment-standards/",
      source: ours,
    },
    {
      title: "Paid family and domestic violence leave",
      href: "https://www.fairwork.gov.au/leave/family-and-domestic-violence-leave",
      source: fairWork,
    },
    {
      title: "Best practice guides for workplace rules",
      href: "https://www.fairwork.gov.au/tools-and-resources/best-practice-guides",
      source: fairWork,
    },
  ],
  safety: [
    {
      title: "Your guide to a safer workplace",
      href: "https://dreamstonehr.com.au/blog/resource/your-guide-to-a-safer-workplace/",
      source: ours,
    },
    {
      title: "Emergency plans",
      href: "https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/emergency-plans-and-procedures",
      source: swa,
    },
    {
      title: "First aid in the workplace",
      href: "https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/first-aid",
      source: swa,
    },
  ],
  performance: [
    {
      title: "Managing Poor Performance",
      href: "https://dreamstonehr.com.au/blog/resource/managing-poor-performance/",
      source: ours,
    },
    {
      title: "Managing underperformance",
      href: "https://www.fairwork.gov.au/tools-and-resources/best-practice-guides/managing-underperformance",
      source: fairWork,
    },
    {
      title: "Building High Performing Teams",
      href: "https://dreamstonehr.com.au/blog/resource/building-high-performing-teams/",
      source: ours,
    },
    {
      title: "Employee Goal Setting Template",
      href: "https://dreamstonehr.com.au/blog/resource/employee-goal-setting-template/",
      source: ours,
    },
    {
      title: "Performance Review Template",
      href: "https://dreamstonehr.com.au/blog/resource/performance-review-template/",
      source: ours,
    },
  ],
  training: [
    {
      title: "Training Needs Analysis Template",
      href: "https://dreamstonehr.com.au/blog/resource/training-needs-analysis-template/",
      source: ours,
    },
    {
      title: "Creating a culture of continuous learning",
      href: "https://dreamstonehr.com.au/blog/creating-culture-continuous-learning-business-owners/",
      source: ours,
    },
    {
      title: "Employee Goal Setting Template",
      href: "https://dreamstonehr.com.au/blog/resource/employee-goal-setting-template/",
      source: ours,
    },
    {
      title: "Probation Review Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/probation-review-checklist-employers/",
      source: ours,
    },
  ],
  culture: [
    {
      title: "Workplace Culture Challenge",
      href: "https://dreamstonehr.com.au/blog/resource/workplace-culture-challenge/",
      source: ours,
    },
    {
      title: "10 practical tips to improve workplace culture",
      href: "https://dreamstonehr.com.au/blog/resource/improve-your-workplace-culture/",
      source: ours,
    },
    {
      title: "What is workplace culture",
      href: "https://dreamstonehr.com.au/blog/resource/what-is-workplace-culture/",
      source: ours,
    },
    {
      title: "The hidden cost of ignoring employee burnout",
      href: "https://dreamstonehr.com.au/blog/burnout-workplace-culture/",
      source: ours,
    },
  ],
  records: [
    {
      title: "Record-keeping and pay slips",
      href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/record-keeping",
      source: fairWork,
    },
    {
      title: "Pay slips",
      href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips",
      source: fairWork,
    },
  ],
  exits: [
    {
      title: "Employee Exit Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/employee-exit-checklist/",
      source: ours,
    },
    {
      title: "Ending employment, including notice and final pay",
      href: "https://www.fairwork.gov.au/ending-employment",
      source: fairWork,
    },
    {
      title: "Making exit interviews count",
      href: "https://dreamstonehr.com.au/blog/making-exit-interviews-count/",
      source: ours,
    },
  ],
  psychosocial: [
    {
      title: "Respect@Work Readiness Check",
      href: "https://dreamstonehr.com.au/blog/resource/respectwork-a-readiness-check-for-employers/",
      source: ours,
    },
    {
      title: "Psychosocial hazards",
      href: "https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/mental-health/psychosocial-hazards",
      source: swa,
    },
    {
      title: "The positive duty",
      href: "https://humanrights.gov.au/our-work/sex-discrimination/positive-duty-sex-discrimination-act",
      source: ahrc,
    },
  ],
}

export const QUESTION_LINKS: Record<string, ResourceLink[]> = {
  "pay-award": [
    {
      title: "Find an award",
      href: "https://www.fairwork.gov.au/pay-and-wages/awards",
      source: fairWork,
    },
    {
      title: "Pay and Conditions Tool",
      href: "https://calculate.fairwork.gov.au/",
      source: fairWork,
    },
  ],
  "pay-above": [
    {
      title: "Penalty rates, overtime and allowances",
      href: "https://www.fairwork.gov.au/pay-and-wages/penalty-rates-allowances-and-other-payments/penalty-rates",
      source: fairWork,
    },
  ],
  "pay-salary": [
    {
      title: "Annualised salaries: what to check and record",
      href: "https://dreamstonehr.com.au/blog/annualised-salary/",
      source: ours,
    },
    {
      title: "Annualised wage arrangements",
      href: "https://www.fairwork.gov.au/pay-and-wages/awards/annualised-wage-arrangements",
      source: fairWork,
    },
  ],
  "pay-payslip": [
    {
      title: "Pay slips",
      href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/pay-slips",
      source: fairWork,
    },
    {
      title: "Payday Super",
      href: "https://www.ato.gov.au/paydaysuper",
      source: ato,
    },
    {
      title: "Tax withheld calculator",
      href: "https://www.ato.gov.au/calculators-and-tools/tax-withheld-calculator/",
      source: ato,
    },
  ],
  "contracts-written": [
    {
      title: "Employment Contract Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/employment-contract-checklist-3/",
      source: ours,
    },
  ],
  "contracts-statements": [
    {
      title: "Fair Work Information Statement",
      href: "https://www.fairwork.gov.au/employment-conditions/national-employment-standards/fair-work-information-statement",
      source: fairWork,
    },
    {
      title: "Casual employees, including the Casual Employment Information Statement",
      href: "https://www.fairwork.gov.au/starting-employment/types-of-employees/casual-employees",
      source: fairWork,
    },
  ],
  "contracts-contractors": [
    {
      title: "Independent contractors",
      href: "https://www.fairwork.gov.au/find-help-for/independent-contractors",
      source: fairWork,
    },
  ],
  "recruit-pd": [
    {
      title: "Recruitment Toolkit",
      href: "https://dreamstonehr.com.au/blog/resource/recruitment-toolkit/",
      source: ours,
    },
  ],
  "recruit-ads": [
    {
      title: "Recruitment Toolkit",
      href: "https://dreamstonehr.com.au/blog/resource/recruitment-toolkit/",
      source: ours,
    },
  ],
  "recruit-interview": [
    {
      title: "Recruitment Toolkit",
      href: "https://dreamstonehr.com.au/blog/resource/recruitment-toolkit/",
      source: ours,
    },
  ],
  "onboard-start": [
    {
      title: "Employee Onboarding Toolkit",
      href: "https://dreamstonehr.com.au/blog/resource/employee-onboarding-toolkit/",
      source: ours,
    },
    {
      title: "Starting employment",
      href: "https://www.fairwork.gov.au/starting-employment",
      source: fairWork,
    },
  ],
  "onboard-casual": [
    {
      title: "Casual employees and the employee choice pathway",
      href: "https://www.fairwork.gov.au/starting-employment/types-of-employees/casual-employees",
      source: fairWork,
    },
  ],
  "onboard-visa": [
    {
      title: "Check visa conditions and work rights",
      href: "https://immi.homeaffairs.gov.au/visas/already-have-a-visa/check-visa-details-and-conditions/check-conditions-online",
      source: homeAffairs,
    },
  ],
  "policies-set": [
    {
      title: "Respectful workplaces: conduct, bullying and harassment",
      href: "https://dreamstonehr.com.au/blog/resource/respectful-workplaces-what-every-employer-needs-to-understand/",
      source: ours,
    },
    {
      title: "Summary of the National Employment Standards",
      href: "https://dreamstonehr.com.au/blog/resource/summary-of-the-national-employment-standards/",
      source: ours,
    },
    {
      title: "Paid family and domestic violence leave",
      href: "https://www.fairwork.gov.au/leave/family-and-domestic-violence-leave",
      source: fairWork,
    },
  ],
  "safety-comp": [
    {
      title: "Workers' compensation",
      href: "https://www.safeworkaustralia.gov.au/workers-compensation",
      source: swa,
    },
  ],
  "safety-evac": [
    {
      title: "Emergency plans",
      href: "https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/emergency-plans-and-procedures",
      source: swa,
    },
  ],
  "safety-firstaid": [
    {
      title: "First aid in the workplace",
      href: "https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/first-aid",
      source: swa,
    },
  ],
  "perf-reviews": [
    {
      title: "Performance Review Template",
      href: "https://dreamstonehr.com.au/blog/resource/performance-review-template/",
      source: ours,
    },
    {
      title: "Building High Performing Teams",
      href: "https://dreamstonehr.com.au/blog/resource/building-high-performing-teams/",
      source: ours,
    },
  ],
  "perf-pip": [
    {
      title: "Performance improvement plan template",
      href: "https://dreamstonehr.com.au/blog/resource/performance-improvement-plan-pip-template/",
      source: ours,
    },
    {
      title: "Managing Poor Performance",
      href: "https://dreamstonehr.com.au/blog/resource/managing-poor-performance/",
      source: ours,
    },
    {
      title: "Managing underperformance",
      href: "https://www.fairwork.gov.au/tools-and-resources/best-practice-guides/managing-underperformance",
      source: fairWork,
    },
  ],
  "perf-conduct": [
    {
      title: "Managing Poor Performance",
      href: "https://dreamstonehr.com.au/blog/resource/managing-poor-performance/",
      source: ours,
    },
  ],
  "train-after": [
    {
      title: "Training Needs Analysis Template",
      href: "https://dreamstonehr.com.au/blog/resource/training-needs-analysis-template/",
      source: ours,
    },
    {
      title: "Creating a culture of continuous learning",
      href: "https://dreamstonehr.com.au/blog/creating-culture-continuous-learning-business-owners/",
      source: ours,
    },
  ],
  "train-probation": [
    {
      title: "Probation Review Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/probation-review-checklist-employers/",
      source: ours,
    },
    {
      title: "Probation",
      href: "https://www.fairwork.gov.au/starting-employment/probation",
      source: fairWork,
    },
  ],
  "train-payreview": [
    {
      title: "Annual wage reviews",
      href: "https://www.fairwork.gov.au/pay-and-wages/minimum-wages/annual-wage-reviews",
      source: fairWork,
    },
  ],
  "culture-turnover": [
    {
      title: "Making exit interviews count",
      href: "https://dreamstonehr.com.au/blog/making-exit-interviews-count/",
      source: ours,
    },
  ],
  "culture-wellbeing": [
    {
      title: "10 practical tips to improve workplace culture",
      href: "https://dreamstonehr.com.au/blog/resource/improve-your-workplace-culture/",
      source: ours,
    },
    {
      title: "Workplace Culture Challenge",
      href: "https://dreamstonehr.com.au/blog/resource/workplace-culture-challenge/",
      source: ours,
    },
    {
      title: "The hidden cost of ignoring employee burnout",
      href: "https://dreamstonehr.com.au/blog/burnout-workplace-culture/",
      source: ours,
    },
    {
      title: "Navigating workplace mental health",
      href: "https://dreamstonehr.com.au/blog/navigating-workplace-mental-health/",
      source: ours,
    },
  ],
  "culture-change": [
    {
      title: "Consultation and cooperation in the workplace",
      href: "https://www.fairwork.gov.au/tools-and-resources/best-practice-guides/consultation-and-cooperation-in-the-workplace",
      source: fairWork,
    },
  ],
  "records-produce": [
    {
      title: "Record-keeping",
      href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/record-keeping",
      source: fairWork,
    },
  ],
  "records-seven": [
    {
      title: "Record-keeping, including how long to keep records",
      href: "https://www.fairwork.gov.au/pay-and-wages/paying-wages/record-keeping",
      source: fairWork,
    },
  ],
  "records-leave": [
    {
      title: "Annual leave",
      href: "https://www.fairwork.gov.au/leave/annual-leave",
      source: fairWork,
    },
  ],
  "exits-notice": [
    {
      title: "Employee Exit Checklist",
      href: "https://dreamstonehr.com.au/blog/resource/employee-exit-checklist/",
      source: ours,
    },
    {
      title: "Ending employment",
      href: "https://www.fairwork.gov.au/ending-employment",
      source: fairWork,
    },
  ],
  "exits-redundancy": [
    {
      title: "Redundancy",
      href: "https://www.fairwork.gov.au/ending-employment/redundancy",
      source: fairWork,
    },
  ],
  "exits-dismissal": [
    {
      title: "Unfair dismissal and the Small Business Fair Dismissal Code",
      href: "https://www.fairwork.gov.au/ending-employment/unfair-dismissal",
      source: fairWork,
    },
  ],
  "psycho-hazards": [
    {
      title: "Psychosocial hazards",
      href: "https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/mental-health/psychosocial-hazards",
      source: swa,
    },
    {
      title: "What psychosocial safety asks employers to show",
      href: "https://dreamstonehr.com.au/blog/nsw-psychosocial-safety-laws-employers/",
      source: ours,
    },
  ],
  "psycho-harass": [
    {
      title: "Respect@Work Readiness Check",
      href: "https://dreamstonehr.com.au/blog/resource/respectwork-a-readiness-check-for-employers/",
      source: ours,
    },
    {
      title: "Why a policy and training are not the whole positive duty",
      href: "https://dreamstonehr.com.au/blog/prevent-workplace-sexual-harassment-policies-training/",
      source: ours,
    },
    {
      title: "The positive duty",
      href: "https://humanrights.gov.au/our-work/sex-discrimination/positive-duty-sex-discrimination-act",
      source: ahrc,
    },
  ],
  "psycho-fdv": [
    {
      title: "Paid family and domestic violence leave",
      href: "https://www.fairwork.gov.au/leave/family-and-domestic-violence-leave",
      source: fairWork,
    },
  ],
}

export const SAFETY_REGULATORS: Record<StateId, ResourceLink> = {
  NSW: { title: "SafeWork NSW", href: "https://www.safework.nsw.gov.au/", source: "New South Wales" },
  VIC: { title: "WorkSafe Victoria", href: "https://www.worksafe.vic.gov.au/", source: "Victoria" },
  QLD: { title: "WorkSafe Queensland", href: "https://www.worksafe.qld.gov.au/", source: "Queensland" },
  SA: { title: "SafeWork SA", href: "https://www.safework.sa.gov.au/", source: "South Australia" },
  WA: { title: "WorkSafe WA", href: "https://www.worksafe.wa.gov.au/", source: "Western Australia" },
  TAS: { title: "WorkSafe Tasmania", href: "https://www.worksafe.tas.gov.au/", source: "Tasmania" },
  NT: { title: "NT WorkSafe", href: "https://worksafe.nt.gov.au/", source: "Northern Territory" },
  ACT: { title: "WorkSafe ACT", href: "https://www.worksafe.act.gov.au/", source: "Australian Capital Territory" },
}

export function linksFor(sectionId: string, weakQuestionIds: string[], state: StateId): ResourceLink[] {
  const questionLinks = weakQuestionIds.flatMap((id) => QUESTION_LINKS[id] ?? [])
  const defaults = SECTION_LINKS[sectionId] ?? []
  const lead = sectionId === "safety" ? [SAFETY_REGULATORS[state]] : []
  const dream = [...questionLinks, ...defaults].find((link) => link.source === ours)
  const primary = weakQuestionIds.length > 0 ? [...lead, ...questionLinks] : [...lead, ...defaults]
  const primaryCap = dream && weakQuestionIds.length > 0 ? 3 : 4

  const seen = new Set<string>()
  const picked: ResourceLink[] = []
  const add = (link?: ResourceLink) => {
    if (!link || seen.has(link.href) || picked.length >= 4) return
    seen.add(link.href)
    picked.push(link)
  }

  for (const link of primary) {
    if (picked.length >= primaryCap) break
    add(link)
  }
  add(dream)
  for (const link of defaults) add(link)
  return picked
}
