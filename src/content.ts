export type ChoiceKind = "solid" | "partial" | "gap" | "unsure" | "na"

export type Choice = {
  id: string
  label: string
  score: number
  kind: ChoiceKind
}

export type Question = {
  id: string
  prompt: string
  why: string
  action: string
  choices: Choice[]
}

export type Section = {
  id: string
  title: string
  purpose: string
  stakes: string
  keep: string
  weight: number
  questions: Question[]
}

const solid = (id: string, label: string): Choice => ({
  id,
  label,
  score: 3,
  kind: "solid",
})
const partial = (id: string, label: string): Choice => ({
  id,
  label,
  score: 2,
  kind: "partial",
})
const gap = (id: string, label: string): Choice => ({
  id,
  label,
  score: 0,
  kind: "gap",
})
const thin = (id: string, label: string): Choice => ({
  id,
  label,
  score: 1,
  kind: "partial",
})
const unsure = (id: string, label = "I'm not sure"): Choice => ({
  id,
  label,
  score: 0,
  kind: "unsure",
})
const na = (id: string, label: string): Choice => ({
  id,
  label,
  score: 0,
  kind: "na",
})

export const sections: Section[] = [
  {
    id: "contracts",
    title: "Employment contracts",
    purpose: "Whether the paperwork matches the way people actually work.",
    stakes:
      "A contract that describes a different job, or a different type of employment, is where back-pay arguments and notice disputes start.",
    keep: "Keep issuing the current template, and re-read it whenever a person's hours or duties change.",
    weight: 1.2,
    questions: [
      {
        id: "contracts-written",
        prompt:
          "Does every employee have a written contract that matches how they actually work — full-time, part-time or casual?",
        why: "Calling someone casual in a letter, then rostering them like a permanent employee, does not decide their status. The real pattern of work does.",
        action:
          "Take one full-time, one part-time and one casual employee. Put the contract next to the last month of hours. Write down every place they disagree, and fix the contract or the roster — not both left as they are.",
        choices: [
          solid("yes", "Yes. Contracts are current and match the real hours and duties."),
          partial("mostly", "Most people have one, but a few are old or do not match the work."),
          thin("some", "Only some people have a written contract."),
          gap("no", "No. We rely on a handshake, an email, or an old letter."),
          unsure("unsure"),
        ],
      },
      {
        id: "contracts-statements",
        prompt:
          "Before a new person starts, do they receive the Fair Work Information Statement — and casuals the Casual Employment Information Statement as well?",
        why: "Both statements are required under the Fair Work Act. They also stop the first-week conversation being only about the roster.",
        action:
          "Download the current Fair Work Information Statement and Casual Employment Information Statement from the Fair Work Ombudsman. Note the date you give them to each new starter, and keep that note with the contract.",
        choices: [
          solid("yes", "Yes. Both are given, and we can show when."),
          partial("sometimes", "We usually do, but it is not consistent or recorded."),
          gap("no", "No. We do not give these out."),
          unsure("unsure"),
        ],
      },
      {
        id: "contracts-fixed",
        prompt:
          "If you use fixed-term contracts, are they limited, with a real end date, rather than renewed as a habit?",
        why: "The Fair Work Act limits how long, and how often, a fixed-term contract can be used for the same work. A contract that keeps rolling can become ongoing employment.",
        action:
          "List anyone on a second or later fixed-term contract. Check the Fair Work Ombudsman's fixed-term contract rules before you renew again. If the work is ongoing, use an ongoing contract.",
        choices: [
          na("na", "We do not use fixed-term contracts."),
          solid("yes", "Yes. Each one has an end date and we have checked the limits."),
          thin("unchecked", "We use them, but we have not checked the current limits."),
          gap("habit", "We renew them because that is how we have always hired."),
          unsure("unsure"),
        ],
      },
      {
        id: "contracts-contractors",
        prompt:
          "Where someone is called a contractor, have you checked they are genuinely contracting and not an employee in all but name?",
        why: "A contract that says 'contractor' does not decide it. Regular hours, your tools, and your direction can still mean employment — including leave, super and pay obligations.",
        action:
          "For each contractor who works mainly for you, write down who sets the hours, who provides tools, and whether they can delegate. If it looks like employment, get the arrangement reviewed before the next renewal.",
        choices: [
          na("na", "We do not engage contractors."),
          solid("yes", "Yes. We have checked, and the ones we use are genuine."),
          thin("assumed", "We call them contractors and have not really tested it."),
          gap("no", "No. Contractor is just how we pay some regular workers."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "awards",
    title: "Award coverage",
    purpose: "Whether you know which award or agreement applies, and at what level.",
    stakes:
      "Paying 'a good rate' does not switch a modern award off. The wrong classification is one of the most common causes of underpayment.",
    keep: "When a role changes, update the classification in the same week, not at the next pay review.",
    weight: 1.35,
    questions: [
      {
        id: "awards-mapped",
        prompt:
          "Do you know which modern award or enterprise agreement covers each role — or have you confirmed that a role is award-free?",
        why: "Coverage follows the work, not the job title. An enterprise agreement only replaces the award where it actually applies.",
        action:
          "Make a one-page list: role, award or agreement, classification, or 'award-free — checked on [date]'. Use the Fair Work Ombudsman's Pay and Conditions Tool as the start, then confirm anything that is borderline.",
        choices: [
          solid("yes", "Yes. Every role is mapped, and the map is current."),
          partial("most", "Most roles are mapped. A few newer ones are not."),
          thin("guess", "We have a rough idea, but nothing written down."),
          gap("no", "No. We pay what feels fair and have not mapped awards."),
          unsure("unsure"),
        ],
      },
      {
        id: "awards-class",
        prompt:
          "Do classifications match the duties people actually perform, and get reviewed when the work changes?",
        why: "A person hired at level 1 who now supervises, opens, or closes is often still being paid at level 1.",
        action:
          "Sit with one supervisor and one long-serving employee. Read the classification description out loud against their week. If the work has moved up, change the classification and the pay from a clear date.",
        choices: [
          solid("yes", "Yes. Classifications follow the work and are reviewed when roles change."),
          partial("start", "They were right at hire, but we do not revisit them."),
          gap("title", "We set pay by job title and have not checked the award levels."),
          unsure("unsure"),
        ],
      },
      {
        id: "awards-allin",
        prompt:
          "If anyone is on a salary or all-in rate meant to cover penalties, overtime or loadings, do you check it still beats the award?",
        why: "An all-in rate has to be tested against the hours actually worked. A quiet week can hide a weekend that the salary did not cover.",
        action:
          "Pick the last pay period that included a weekend, evening or overtime. Add up what the award would have paid for those hours, including penalties. If the salary was lower, top it up and reset the arrangement.",
        choices: [
          na("na", "We pay the award properly, with penalties and overtime shown separately."),
          solid("yes", "Yes. We reconcile at least yearly, and when hours change."),
          thin("once", "We checked once when we set the salary, not since."),
          gap("no", "No. The salary is higher than the base rate, so we treat the award as done."),
          unsure("unsure"),
        ],
      },
      {
        id: "awards-special",
        prompt:
          "Are junior, apprentice, trainee and shift arrangements — if you have them — taken from the award, not from a house rule?",
        why: "Junior rates, apprentice progression and shift penalties are set by the instrument. A local custom is not a defence.",
        action:
          "List every junior, apprentice, trainee and regular shift worker. Next to each name, note the award clause you are applying. If you cannot point to the clause, pause the house rule and check it.",
        choices: [
          na("na", "We do not have juniors, apprentices, trainees or shift penalties."),
          solid("yes", "Yes. Those arrangements follow the award or agreement."),
          thin("mixed", "Some do. A few are just how we have always done it."),
          gap("house", "We use our own rates or shift rules."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "payroll",
    title: "Payroll compliance",
    purpose: "Whether people are paid the right amount, on time, with a proper record.",
    stakes:
      "Payroll errors compound. A rate that was never updated, or super that arrives late, is a debt to the person and a problem with the ATO or the Fair Work Ombudsman.",
    keep: "After every annual wage review, check one casual and one full-time payslip against the new rates before the first pay run.",
    weight: 1.35,
    questions: [
      {
        id: "payroll-rates",
        prompt:
          "Are pay rates checked against the current award or agreement after each annual wage review?",
        why: "Award rates usually change from the first full pay period on or after 1 July. Last year's rate left in the software is an underpayment, even if it was an honest miss.",
        action:
          "Open the payroll system and compare three rates with the current award or agreement. Update anything that is short, and pay the difference for the periods it was wrong.",
        choices: [
          solid("yes", "Yes. Rates are updated each year and someone checks them."),
          partial("software", "The software updates, but nobody checks the result."),
          gap("old", "We are still on an older rate, or we do not know."),
          unsure("unsure"),
        ],
      },
      {
        id: "payroll-penalties",
        prompt:
          "Are penalty rates, overtime, allowances and loadings calculated by the payroll system from the timesheet, not from memory?",
        why: "Saturday rates, laundry allowances and overtime triggers are easy to drop when someone is busy. The system should carry them.",
        action:
          "Run last week's timesheets for a person who worked outside ordinary hours. Confirm the payslip shows the penalty or overtime as its own line. If it does not, correct the rule in payroll before the next pay.",
        choices: [
          solid("yes", "Yes. The system applies them and the payslip shows the lines."),
          partial("manual", "We add them manually, and it depends who is doing the pay."),
          gap("no", "We pay a flat rate and do not add penalties."),
          unsure("unsure"),
        ],
      },
      {
        id: "payroll-payslip",
        prompt:
          "Does every employee get a payslip within one working day of being paid, with the hours, rate, deductions, super and pay period on it?",
        why: "Payslips are a Fair Work requirement, not a courtesy. They are also how a person spots an error while it is still small.",
        action:
          "Pull the last payslip for one casual and one full-time employee. Check the date it was issued and whether the required items are there. Turn on automatic payslips if they are late or incomplete.",
        choices: [
          solid("yes", "Yes. Payslips go out on time and include those items."),
          partial("late", "They get a payslip, but it is often late or missing detail."),
          gap("no", "No. People are paid without a proper payslip."),
          unsure("unsure"),
        ],
      },
      {
        id: "payroll-super",
        prompt:
          "Is superannuation paid each payday so it reaches the fund within 7 business days, at 12% of qualifying earnings?",
        why: "From 1 July 2026, Payday Super replaced quarterly super. The contribution has to be received by the fund, and able to be allocated, within 7 business days of payday unless a longer exception applies. The Small Business Superannuation Clearing House has closed.",
        action:
          "Check a payday since 1 July 2026. Confirm the super left in time to reach the fund within 7 business days, that the fund details are current, and that qualifying earnings and super liability are in your STP report. Pay on payday if your clearing house needs the extra days.",
        choices: [
          solid("yes", "Yes. Super goes with payday and we can see it reach the fund."),
          partial("shifting", "We are moving off quarterly payments, but it is not reliable yet."),
          gap("quarterly", "We still pay quarterly, or we are not sure it arrives on time."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "leave",
    title: "Leave and minimum standards",
    purpose: "Whether the National Employment Standards are understood and applied.",
    stakes:
      "Leave is not a favour. Getting annual leave, personal leave or family and domestic violence leave wrong damages trust and creates a debt.",
    keep: "Keep leave balances visible to managers before they approve or refuse a request.",
    weight: 1.1,
    questions: [
      {
        id: "leave-nes",
        prompt:
          "Can the business correctly apply the National Employment Standards that fit your team — annual leave, personal/carer's leave, compassionate leave, parental leave, and paid family and domestic violence leave?",
        why: "These are minimums. A contract or policy cannot undercut them. Paid family and domestic violence leave is 10 days for eligible employees.",
        action:
          "Write a one-page leave sheet for managers: what each leave type is, who is eligible, and what evidence you can reasonably ask for. Check it against the Fair Work Ombudsman's leave pages before you publish it.",
        choices: [
          solid("yes", "Yes. Managers apply these correctly, including family and domestic violence leave."),
          partial("some", "Annual and sick leave are fine. The less common types are shaky."),
          gap("no", "We handle leave case by case, without a clear standard."),
          unsure("unsure"),
        ],
      },
      {
        id: "leave-public",
        prompt:
          "Are public holiday arrangements clear, including what is paid if the business is closed or if someone works?",
        why: "Public holiday pay depends on the employment type and the award or agreement. A group text on the day is not an arrangement.",
        action:
          "For the next public holiday, decide now who is working, who is off, and what each person is paid. Put that rule where managers can find it.",
        choices: [
          solid("yes", "Yes. The rule is written and matches the award or agreement."),
          partial("usual", "We have a usual practice, but it is not written or checked."),
          gap("no", "It depends on the week and who is asking."),
          unsure("unsure"),
        ],
      },
      {
        id: "leave-types",
        prompt:
          "Do full-time, part-time and casual employees receive the leave and loadings that match their employment type?",
        why: "Part-time leave accrues on ordinary hours. Many casuals do not accrue annual or paid personal leave, and are compensated through a loading that has to actually be paid.",
        action:
          "Check one person of each type in payroll. Confirm leave accrual and, for casuals, that the loading is a separate, correct line and not quietly missing.",
        choices: [
          solid("yes", "Yes. Accrual and loadings match the employment type."),
          partial("mostly", "Mostly, with the odd person set up on the wrong rule."),
          gap("same", "Everyone is set up the same way in payroll."),
          unsure("unsure"),
        ],
      },
      {
        id: "leave-lsl",
        prompt:
          "Is long service leave tracked against the rules for your state or territory, including any portable scheme in your industry?",
        why: "Long service leave is state and territory law, not a single national rule. Some industries also have portable schemes. It is easy to miss until someone with long service asks.",
        action:
          "Add a long-service date to each employee record. Look up the qualifying period for your state or territory and any portable scheme in your industry, and put the owner of that tracking in writing.",
        choices: [
          solid("yes", "Yes. It is tracked against the right state or scheme rules."),
          thin("later", "We will look at it when someone gets close to qualifying."),
          gap("no", "We do not track long service leave."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "safety",
    title: "Safety and psychological safety",
    purpose: "Whether physical and psychological health are managed as part of the work.",
    stakes:
      "Safety duties sit with the business, under your state or territory law. Psychological harm — overload, bullying, aggression, harassment — is part of that duty, not a personal resilience issue.",
    keep: "Keep asking, in ordinary meetings, what in the work is wearing people down. Then change the work, not only the person.",
    weight: 1.3,
    questions: [
      {
        id: "safety-incidents",
        prompt:
          "Is there a simple way to report a physical hazard, near miss or injury, and do you record what was done about it?",
        why: "A duty to manage risk includes noticing it. If people have nowhere obvious to report, the business cannot show it responded.",
        action:
          "Agree one reporting path that fits your size: a book, a shared form, or a named person. Record the last three issues and the change you made. Tell the team where to report, in one sentence, this week.",
        choices: [
          solid("yes", "Yes. People use it, and we record the fix."),
          partial("informal", "People tell a manager, but little is written down."),
          gap("no", "No. We deal with injuries if they happen and move on."),
          unsure("unsure"),
        ],
      },
      {
        id: "safety-psych",
        prompt:
          "Have you identified the psychosocial hazards in this workplace — such as unreasonable job demands, poor support, bullying, isolated work, or aggression from customers?",
        why: "Employers must manage risks to psychological health so far as is reasonably practicable. You cannot control a hazard you have not named.",
        action:
          "Write the five hazards most likely in your work. Ask two employees if the list is fair. For the top one, change something concrete: staffing, roster, client handling, or how a manager speaks to the team.",
        choices: [
          solid("yes", "Yes. We have named them and changed the work where we needed to."),
          partial("talked", "We have talked about stress, but not written the hazards down."),
          gap("no", "No. We have not looked at psychological hazards."),
          unsure("unsure"),
        ],
      },
      {
        id: "safety-response",
        prompt:
          "When workload, conflict or behaviour is raised, do you look at the work itself — rosters, staffing, customers — as well as the person?",
        why: "Sending someone to 'cope better' while the roster stays unsafe does not meet the duty, and people stop reporting.",
        action:
          "Take the last concern that was raised. Write what you changed in the work, not only what you said to the person. If you cannot name a change, that concern is still open.",
        choices: [
          solid("yes", "Yes. We look at the work and we tell the person what changed."),
          partial("person", "We support the person, but the work usually stays the same."),
          gap("no", "Concerns are treated as attitude or resilience."),
          unsure("unsure"),
        ],
      },
      {
        id: "safety-respect",
        prompt:
          "Have you taken steps to prevent sexual harassment and sex-based hostility, with a way to report that does not go only through the person being complained about?",
        why: "The positive duty in the Sex Discrimination Act requires reasonable and proportionate steps to eliminate this conduct, not only a response after a complaint.",
        action:
          "Name an alternative reporting path this week, even if it is an external HR contact or a second manager. Tell staff in writing. Check that leaders know a complaint about a peer or a client must be acted on.",
        choices: [
          solid("yes", "Yes. Prevention and a real alternative reporting path are in place."),
          partial("policy", "We have a policy, but reporting still goes through one person."),
          gap("no", "We would deal with it if it happened. Nothing is in place now."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "conduct",
    title: "Conduct and everyday expectations",
    purpose: "Whether people know the rules that govern a normal week, not only a crisis.",
    stakes:
      "A policy no one can find will not help you in a dispute. Clear expectations about conduct, hours and after-hours contact prevent most of those disputes.",
    keep: "When a policy changes, tell people what changed in plain words. Do not only replace the file.",
    weight: 1,
    questions: [
      {
        id: "conduct-policies",
        prompt:
          "Can people find a short set of current rules covering conduct, bullying and harassment, how to raise a concern, leave, and work health and safety?",
        why: "You do not need a manual the size of a novel. You do need the rules that match how the business actually runs, and people need to know where they are.",
        action:
          "Check that those five topics exist, are dated this year or last, and can be opened by a new starter without asking the owner. Rewrite anything that describes a process you do not really use.",
        choices: [
          solid("yes", "Yes. They exist, they are current, and people can find them."),
          partial("somewhere", "They exist somewhere, but they are old or hard to find."),
          gap("no", "No. Expectations live in people's heads."),
          unsure("unsure"),
        ],
      },
      {
        id: "conduct-managers",
        prompt:
          "Do the people who supervise others know what to do in the first conversation when a concern is raised?",
        why: "Most complaints get better or much worse in the first conversation. A manager who investigates nothing, or who promises total secrecy, creates the next problem.",
        action:
          "Give supervisors a half-page guide: listen, do not decide on the spot, write down what you were told, tell the person what happens next, and escalate the same day if it involves safety, harassment or theft.",
        choices: [
          solid("yes", "Yes. Supervisors have been shown this and use it."),
          partial("some", "Some managers are confident. Others avoid the conversation."),
          gap("no", "They are expected to use common sense."),
          unsure("unsure"),
        ],
      },
      {
        id: "conduct-disconnect",
        prompt:
          "Are expectations about hours, overtime and contact outside work written down, including the right to disconnect?",
        why: "Employees can refuse to monitor or respond to contact outside working hours unless the refusal is unreasonable. The right has applied to small business employees since 26 August 2025, and to other employees since 26 August 2024.",
        action:
          "Write three sentences for the team: ordinary hours, when overtime is approved, and what after-hours contact is for (for example a genuine client emergency, not routine email). Share it with anyone who manages people.",
        choices: [
          solid("yes", "Yes. Hours and after-hours contact are written and followed."),
          partial("implied", "People roughly know, but it is not written and varies by manager."),
          gap("always", "People are expected to answer whenever the business needs them."),
          unsure("unsure"),
        ],
      },
      {
        id: "conduct-monitor",
        prompt:
          "If you monitor email, devices, cameras or social media, have people been told what is watched and why?",
        why: "Monitoring that staff do not know about damages trust and can breach workplace surveillance rules in your state or territory.",
        action:
          "List what you monitor. If the list is not empty, tell staff in writing what it is, why you do it, and where the record goes. Check your state surveillance rules before you add anything new.",
        choices: [
          na("na", "We do not monitor devices, cameras or staff social media."),
          solid("yes", "Yes. People have been told what is monitored and why."),
          gap("quiet", "We monitor some things and have not really told people."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "lifecycle",
    title: "Starting well, performance and exits",
    purpose: "Whether people enter, are managed, and leave in a way that is fair and recorded.",
    stakes:
      "A poor exit, or a performance issue that was never put in words, is the usual path to an unfair dismissal or general protections claim.",
    keep: "Keep the first week and the last week as checklists, owned by a named person, not by whoever is free.",
    weight: 1.05,
    questions: [
      {
        id: "life-start",
        prompt:
          "In the first week, does a new starter receive the contract, classification or award, policies, a safety induction, and a person they can ask?",
        why: "The first week is when you set the employment relationship in fact, not only in the advertisement.",
        action:
          "Write a first-week list of ten items and tick it for the next hire. Include bank and super details, the information statements, how to report a hazard, and who approves overtime.",
        choices: [
          solid("yes", "Yes. There is a first-week list and it is followed."),
          partial("varies", "It depends who is onboarding them."),
          gap("no", "They start on the tools and pick it up."),
          unsure("unsure"),
        ],
      },
      {
        id: "life-performance",
        prompt:
          "When performance slips, do you raise it early, be specific, and give a fair chance to improve before any warning or exit?",
        why: "A surprise dismissal after months of silence is difficult to defend. Early, specific feedback is also kinder and usually works.",
        action:
          "For anyone you are worried about, write the gap in observable terms, meet them, agree what 'better' looks like, and diary a review date. Keep the note.",
        choices: [
          solid("yes", "Yes. Issues are raised early, in writing, with a chance to improve."),
          partial("verbal", "We say something, but it is verbal and vague."),
          gap("sudden", "We put up with it, then end it when we have had enough."),
          unsure("unsure"),
        ],
      },
      {
        id: "life-exit",
        prompt:
          "When someone leaves, do they receive the right notice or payment in lieu, outstanding wages and leave, and a record of why?",
        why: "Final pay is not discretionary. Notice depends on the contract, the award and the National Employment Standards. A missing reason makes a later claim harder to answer.",
        action:
          "Make a last-pay checklist: notice, annual leave balance, any time off in lieu, outstanding hours, super on the final pay, and company property. Use it on the next exit, including a resignation.",
        choices: [
          solid("yes", "Yes. Final pay and the reason are handled on a checklist."),
          partial("pay", "We pay them out, but the paperwork is thin."),
          gap("no", "Exits are informal."),
          unsure("unsure"),
        ],
      },
      {
        id: "life-dismissal",
        prompt:
          "If you dismiss someone, is there a fair process — the Small Business Fair Dismissal Code where it applies, or a fuller process if you have 15 or more employees?",
        why: "Small business employers generally follow the Small Business Fair Dismissal Code. Larger employers need a reason and a process: the concern, a chance to respond, and a decision that is not predetermined.",
        action:
          "Before the next dismissal, write the reason, the warnings or the serious misconduct, and the chance the person had to respond. If you have fewer than 15 employees, read the Small Business Fair Dismissal Code first.",
        choices: [
          solid("yes", "Yes. We follow a fair process and keep the record."),
          partial("try", "We try to be fair, but we do not follow a set process."),
          gap("no", "We have not had to think about it, or we decide and tell them."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "records",
    title: "Employee records",
    purpose: "Whether you could produce the records the law expects you to keep.",
    stakes:
      "If a pay or leave question is asked and you cannot produce the record, the conversation starts in the employee's favour. Employee records generally must be kept for 7 years.",
    keep: "Once a quarter, open a leaver's file and a current casual's file and check you can still find the contract, hours and payslips.",
    weight: 1.15,
    questions: [
      {
        id: "records-produce",
        prompt:
          "Could you, this week, produce a contract, recent payslips and a record of hours for any employee if you were asked?",
        why: "Fair Work inspectors and employees can ask. Hunting through an inbox is not a system.",
        action:
          "Pick an employee at random, including someone who has left in the last year. Time how long it takes to find the contract, the last three payslips and the hours. If it takes more than a few minutes, fix the filing before you do anything else in this section.",
        choices: [
          solid("yes", "Yes. Those records are in one place and can be produced quickly."),
          partial("slow", "We could, but it would take a search across inboxes and drives."),
          gap("no", "No. Some of those records do not exist."),
          unsure("unsure"),
        ],
      },
      {
        id: "records-seven",
        prompt:
          "Are time and wage records kept for at least 7 years, including for people who have left?",
        why: "The Fair Work Regulations require employee records to be kept for 7 years. Deleting a leaver's file when they walk out breaks that, and it removes your defence.",
        action:
          "Stop deleting leaver files. Put a hold on payroll and contract records for 7 years, and check that backups are included.",
        choices: [
          solid("yes", "Yes. Current and former employee records are kept for 7 years."),
          partial("current", "Current staff are fine. Leavers are deleted or lost."),
          gap("no", "We do not have a retention rule."),
          unsure("unsure"),
        ],
      },
      {
        id: "records-details",
        prompt:
          "Are the details payroll depends on current — tax, super fund, bank, emergency contact, and work rights where a visa applies?",
        why: "Wrong super fund details are how Payday Super payments bounce. A visa condition you have not checked is a separate legal problem.",
        action:
          "Ask every employee to confirm super fund, bank and emergency contact details. For anyone on a visa, diarise the expiry and the work condition, and look again before it lapses.",
        choices: [
          solid("yes", "Yes. We review these and visa holders are diarised."),
          partial("start", "They were right at the start. We do not revisit them."),
          gap("no", "We would not know if they were out of date."),
          unsure("unsure"),
        ],
      },
      {
        id: "records-owner",
        prompt:
          "If the person who 'does the HR' is away, can someone else find the contracts, policies and payroll records?",
        why: "A system that lives in one person's head or laptop is not a business system. It fails on the week you most need it.",
        action:
          "Name a second person and give them access this month. Have them find one contract and one policy without help. If they cannot, the system is the laptop, and it needs to move.",
        choices: [
          solid("yes", "Yes. Access is shared and has been tested."),
          partial("theory", "In theory yes. We have not tried."),
          gap("one", "No. It sits with one person."),
          unsure("unsure"),
        ],
      },
    ],
  },
]

export const questions = sections.flatMap((section) =>
  section.questions.map((question) => ({ ...question, sectionId: section.id })),
)

export const HEADCOUNTS = [
  {
    id: "under-15",
    label: "Fewer than 15 employees",
    detail: "Usually a small business employer under the Fair Work Act",
  },
  {
    id: "15-99",
    label: "15 to 99 employees",
    detail: "A growing team, with the fuller set of minimum standards",
  },
  {
    id: "100-plus",
    label: "100 or more employees",
    detail: "Same core duties, with more need for a consistent process",
  },
] as const

export const AWARD_SITUATIONS = [
  {
    id: "covered",
    label: "Most roles are covered by a modern award",
  },
  {
    id: "mixed",
    label: "A mix of award-covered and award-free roles",
  },
  {
    id: "agreement",
    label: "An enterprise agreement covers the team",
  },
  {
    id: "award-free",
    label: "We have checked, and the roles are award-free",
  },
  {
    id: "unsure",
    label: "I'm not sure what covers us",
  },
] as const

export const STATES = [
  { id: "NSW", label: "New South Wales" },
  { id: "VIC", label: "Victoria" },
  { id: "QLD", label: "Queensland" },
  { id: "SA", label: "South Australia" },
  { id: "WA", label: "Western Australia" },
  { id: "TAS", label: "Tasmania" },
  { id: "NT", label: "Northern Territory" },
  { id: "ACT", label: "Australian Capital Territory" },
] as const

export type HeadcountId = (typeof HEADCOUNTS)[number]["id"]
export type AwardId = (typeof AWARD_SITUATIONS)[number]["id"]
export type StateId = (typeof STATES)[number]["id"]

export type Profile = {
  businessName: string
  state: StateId
  headcount: HeadcountId
  award: AwardId
}
