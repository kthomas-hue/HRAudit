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

const solid = (id: string, label: string): Choice => ({ id, label, score: 3, kind: "solid" })
const partial = (id: string, label: string): Choice => ({ id, label, score: 2, kind: "partial" })
const gap = (id: string, label: string): Choice => ({ id, label, score: 0, kind: "gap" })
const thin = (id: string, label: string): Choice => ({ id, label, score: 1, kind: "partial" })
const unsure = (id: string, label = "I'm not sure"): Choice => ({ id, label, score: 0, kind: "unsure" })
const na = (id: string, label: string): Choice => ({ id, label, score: 0, kind: "na" })

export const sections: Section[] = [
  {
    id: "pay",
    title: "Pay and entitlements",
    purpose: "Awards, classifications, allowances, and what actually lands in the pay.",
    stakes:
      "Paying above the base rate does not turn a modern award off. The wrong classification, a missing allowance, or a salary that was never checked against the hours is how underpayments start.",
    keep: "When a role changes, update the classification in the same week, and recheck the rate after each annual wage review.",
    weight: 1.4,
    questions: [
      {
        id: "pay-award",
        prompt:
          "Is every role mapped to the correct modern award or enterprise agreement, and to the classification that matches the work?",
        why: "Different jobs in the same business can sit under different awards. A job title does not decide the level.",
        action:
          "List each role, the award or agreement, and the classification. Use the Fair Work Ombudsman's Pay and Conditions Tool as the start. If someone now supervises, opens, or closes, check whether the level has moved.",
        choices: [
          solid("yes", "Yes. Every role is mapped, and the classification matches the duties."),
          partial("most", "Most roles are mapped. Newer ones, or changed duties, are not."),
          thin("guess", "We have a rough idea, but nothing written down."),
          gap("no", "No. We pay what feels fair and have not mapped awards."),
          unsure("unsure"),
        ],
      },
      {
        id: "pay-above",
        prompt:
          "If you pay above the award, do you still apply the other award conditions — penalties, overtime, allowances, breaks, and hours?",
        why: "A higher rate does not switch those conditions off. A flat rate that 'should cover it' still has to be tested against the hours people work.",
        action:
          "Take one person on a salary or flat rate and one recent pay period that included a weekend, evening, or overtime. Add up the award total, including penalties and allowances. If the flat rate was lower, top it up and write down how the rate is built.",
        choices: [
          solid("yes", "Yes. We know the other conditions still apply, and we meet them."),
          partial("rates", "Minimum rates are right. Allowances, penalties, or leave loading need a review."),
          gap("enough", "We pay above the award, so we treat the rest as covered."),
          gap("flat", "We pay a flat rate we believe is enough to cover allowances."),
          unsure("unsure"),
        ],
      },
      {
        id: "pay-salary",
        prompt:
          "Where someone is on an annual salary or flat rate, is there a written breakdown showing how it beats the award?",
        why: "Telling someone the salary is higher is not an annualised wage arrangement. They should be able to see what the award would have paid, and by how much the salary is ahead.",
        action:
          "For each salaried or flat-rate employee, write a one-page table: award base, penalties, overtime, allowances, and the salary. Share it with them. Diary a check each year and whenever hours change.",
        choices: [
          na("na", "Nobody is on a salary or flat rate meant to absorb award entitlements."),
          solid("yes", "Yes. There is an itemised agreement, and we reconcile it."),
          thin("verbal", "We tell them the award figure and the salary. That is all."),
          gap("no", "No. We have not set this out."),
          unsure("unsure"),
        ],
      },
      {
        id: "pay-payslip",
        prompt:
          "Does every employee get a payslip within one working day, showing base pay, allowances, overtime, and penalties separately — and is super paid each payday?",
        why: "Payslips are required within one working day of pay. From 1 July 2026, super guarantee has to reach the fund within 7 business days of payday, at 12% of qualifying earnings. The quarterly habit is no longer enough.",
        action:
          "Open the last payslip for one casual and one full-timer. If components are bundled, or it went out late, fix the payroll rule before the next run. Check a payday since 1 July 2026 and confirm the super reached the fund within 7 business days.",
        choices: [
          solid("yes", "Yes. Payslips are on time and itemised, and super goes with payday."),
          partial("slip", "Payslips go out, but they are late, bundled, or super is still quarterly."),
          gap("no", "People are paid without a proper payslip, or super timing is unclear."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "contracts",
    title: "Employment contracts",
    purpose: "Whether the agreement matches the job, and the required statements go out.",
    stakes:
      "A missing contract, or one that describes a different job, is where notice, pay, and status disputes start.",
    keep: "When hours, duties, or reporting lines change, issue a variation letter in the same week.",
    weight: 1.25,
    questions: [
      {
        id: "contracts-written",
        prompt: "Does every employee have a written agreement that matches how they actually work?",
        why: "The useful contract names the award and classification where one applies, the hours, the pay, notice, and leave. A letter that says full-time while the roster is casual does not decide the status.",
        action:
          "Compare one full-time, one part-time, and one casual contract with the last month of hours. Note every mismatch. Where duties or hours have changed, issue a variation rather than leaving the old contract in the file.",
        choices: [
          solid("yes", "Yes. Contracts are current and match the hours, pay, and duties."),
          partial("mostly", "Most people have one. A few are old or missing key terms."),
          thin("some", "Only some people have a written contract."),
          gap("no", "No. We rely on a handshake, an email, or an old letter."),
          unsure("unsure"),
        ],
      },
      {
        id: "contracts-statements",
        prompt:
          "Do new starters receive the Fair Work Information Statement, and casuals the Casual Employment Information Statement?",
        why: "Both are Fair Work requirements. They also set the employment type before the first shift.",
        action:
          "Download the current statements from the Fair Work Ombudsman. Give them with the contract, and note the date on the employee file.",
        choices: [
          solid("yes", "Yes. Both are issued, and we can show when."),
          partial("sometimes", "We usually do, but it is not consistent or recorded."),
          gap("no", "No. We do not give these out."),
          unsure("unsure"),
        ],
      },
      {
        id: "contracts-contractors",
        prompt:
          "Where someone is called a contractor, have you checked they are not an employee in all but name?",
        why: "A contract that says contractor does not decide it. Regular hours, your tools, and your direction can still mean employment, including leave, super, and pay.",
        action:
          "For each contractor who works mainly for you, note who sets the hours, who provides the tools, and whether they can delegate the work. If it looks like employment, review the arrangement before it rolls on.",
        choices: [
          na("na", "We do not engage contractors."),
          solid("yes", "Yes. We have checked, and the ones we use are genuine contractors."),
          thin("assumed", "We call them contractors and have not really tested it."),
          gap("no", "Contractor is how we pay some regular workers."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "recruitment",
    title: "Recruitment and talent",
    purpose: "Whether roles are described clearly before anyone is hired.",
    stakes:
      "A hire made against a vague ad is hard to manage later. The position description is also what you compare with the award classification.",
    keep: "Review the position description when the work changes, not when you next recruit.",
    weight: 1,
    questions: [
      {
        id: "recruit-pd",
        prompt:
          "Does each role have a position description that matches the work and the award classification?",
        why: "A position description sets duties, inherent requirements, and who the role reports to. It is also the document you use when performance slips.",
        action:
          "Pick the three busiest roles. Write or update a short position description: duties, who they report to, and the award classification. Base it on the work the business needs, not on the person currently in the seat.",
        choices: [
          solid("yes", "Yes. They exist, they are reviewed, and they line up with the award level."),
          partial("some", "Only some roles have one, or the ones we have are out of date."),
          gap("no", "We do not use position descriptions."),
          unsure("unsure"),
        ],
      },
      {
        id: "recruit-ads",
        prompt: "Do job advertisements describe the real role, and match the position description?",
        why: "An ad that sells a different job creates the wrong hire, and it is difficult to manage someone against duties they were never shown.",
        action:
          "Before the next ad goes out, read it next to the position description. Take out anything the role does not do, and add the requirements you will actually assess.",
        choices: [
          solid("yes", "Yes. Ads are written from the position description."),
          thin("loose", "Ads are roughly right, but they are not checked against the description."),
          gap("no", "No. Ads are written from scratch each time."),
          unsure("unsure"),
        ],
      },
      {
        id: "recruit-interview",
        prompt:
          "Are interviews consistent, based on the role, and written down — including how unsuccessful people are told?",
        why: "Asking different questions of different people, or keeping no notes, is how bias and disputes creep into hiring.",
        action:
          "Use one question set for the role, score candidates against the requirements, and keep the notes. Email applicants you did not interview. Call the people you did interview and did not hire.",
        choices: [
          solid("yes", "Yes. Questions are consistent, notes are kept, and people are told the outcome."),
          partial("some", "We interview properly, but notes or the follow-up are patchy."),
          gap("no", "Interviews depend on who is free, and little is written down."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "onboarding",
    title: "New hires and onboarding",
    purpose: "Whether the first weeks set the employment up properly.",
    stakes:
      "The first week is when award level, safety, policies, and employment type become real. Leaving them until later is how gaps become habits.",
    keep: "Use the same first-week list for every hire, and tick it.",
    weight: 1.05,
    questions: [
      {
        id: "onboard-start",
        prompt:
          "In the first week, does a new person get the safety induction, how to report an incident, the policies, and what hours are expected?",
        why: "A start that is only 'follow them around' leaves safety, conduct, and working time to chance.",
        action:
          "Write a first-week list and use it on the next hire: workplace safety, bullying and harassment, incident reporting, where policies live, hours, uniform, and who to ask.",
        choices: [
          solid("yes", "Yes. There is a first-week list and it is followed."),
          partial("varies", "It depends who is onboarding them."),
          gap("no", "They start on the tools and pick it up."),
          unsure("unsure"),
        ],
      },
      {
        id: "onboard-casual",
        prompt:
          "If you employ casuals, do you respond in writing when an eligible casual asks to become permanent?",
        why: "Eligible casuals can use the employee choice pathway — after 12 months in a small business, and after 6 months otherwise. A verbal chat with no record is not a response.",
        action:
          "Note who is casual and when they started. If someone asks to change, reply in writing with the decision and the reason. Keep that note on the file.",
        choices: [
          na("na", "We do not employ casuals."),
          solid("yes", "Yes. Requests are answered in writing and kept."),
          thin("verbal", "We have had requests and dealt with them verbally."),
          gap("no", "We are not sure how this applies, and nothing is in place."),
          unsure("unsure"),
        ],
      },
      {
        id: "onboard-visa",
        prompt: "Do you check work rights for anyone who is not an Australian citizen, and diary the expiry?",
        why: "A visa condition is a condition of the employment. Finding out after it lapses is too late.",
        action:
          "List anyone working on a visa. Record the expiry and the work condition, and look again before that date.",
        choices: [
          na("na", "Everyone working here is an Australian citizen."),
          solid("yes", "Yes. We check work rights and diary the expiry."),
          gap("no", "We do not check, or we checked once at the start."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "policies",
    title: "Policies and procedures",
    purpose: "Whether the rules exist, are current, and are actually used.",
    stakes:
      "A policy no one has seen will not help in a dispute. A policy you do not follow is worse, because it describes a business you do not run.",
    keep: "When a policy changes, tell people what changed in plain words and ask them to acknowledge it.",
    weight: 1,
    questions: [
      {
        id: "policies-set",
        prompt:
          "Is there a current set of employment policies people can find, covering conduct, leave, safety, and how to raise a concern?",
        why: "You do not need a novel. You do need rules that match how the business works, kept where a new starter can open them.",
        action:
          "Check those topics exist, are dated, and can be opened without asking the owner. Rewrite anything that describes a step you do not really use.",
        choices: [
          solid("yes", "Yes. There is a current handbook and people can find it."),
          partial("old", "Something exists, but it is old or hard to find."),
          gap("no", "There are no real policies."),
          unsure("unsure"),
        ],
      },
      {
        id: "policies-ack",
        prompt: "Do staff acknowledge policies, and later changes, in writing?",
        why: "An acknowledgement is how you show the person was given the rule. A file on a drive is not the same thing.",
        action:
          "On the next policy update, ask each person to confirm in writing that they have read the change. Keep that confirmation.",
        choices: [
          solid("yes", "Yes. Acceptance is recorded, including when a policy changes."),
          thin("start", "They sign at induction. Changes are not re-acknowledged."),
          gap("no", "No."),
          unsure("unsure"),
        ],
      },
      {
        id: "policies-lived",
        prompt: "Are the policies followed by staff and applied by managers?",
        why: "A rule that is ignored becomes the argument that the business does not take it seriously.",
        action:
          "Pick one policy that is often bent — hours, leave, or conduct. Tell managers the one situation in which it applies this month, and back them when they use it.",
        choices: [
          solid("yes", "Yes. Managers apply them, and staff can see that."),
          partial("sometimes", "It depends on the manager."),
          gap("no", "They sit in a folder."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "safety",
    title: "Workplace health and safety",
    purpose: "Insurance, injuries, emergencies, and first aid.",
    stakes:
      "Workers compensation insurance is not optional. Without a way to evacuate, or someone who can give first aid, a small incident becomes a larger one.",
    keep: "Walk the evacuation route twice a year, and replace first-aid training before it expires.",
    weight: 1.25,
    questions: [
      {
        id: "safety-comp",
        prompt:
          "Do you hold workers compensation insurance, and does someone know what to do if a person is injured at work?",
        why: "The policy has to be in place before the injury. Afterwards you need a return-to-work path, not only a claim form.",
        action:
          "Confirm the policy is current and covers the work you do. Write five lines for managers: who to call, how to record the injury, and how a return to work is agreed.",
        choices: [
          solid("yes", "Yes. We are insured, and managers know the injury steps."),
          partial("insured", "We are insured. The 'what happens next' is unclear."),
          gap("no", "No. We do not have workers compensation insurance, or we are not sure."),
          unsure("unsure"),
        ],
      },
      {
        id: "safety-evac",
        prompt: "Is there a written evacuation procedure for fire or another emergency, and have people seen it?",
        why: "An emergency plan that lives in someone's head is not a plan on the day.",
        action:
          "Write the exit route, the assembly point, and who accounts for people. Put it where the team can see it, and walk it once.",
        choices: [
          solid("yes", "Yes. It is written, and people have been shown it."),
          thin("informal", "People would probably know where to go. It is not written."),
          gap("no", "No."),
          unsure("unsure"),
        ],
      },
      {
        id: "safety-firstaid",
        prompt: "Are enough people current in first aid and CPR for the way this workplace operates?",
        why: "Cover has to match the hours you are open and the sites you work on, not a course someone did years ago.",
        action:
          "List who holds a current certificate and which shifts or sites they cover. Book training for any gap before the next certificate expires.",
        choices: [
          solid("yes", "Yes. Cover is current for our hours and sites."),
          partial("one", "One person is trained, and we are exposed when they are away."),
          gap("no", "No one current is trained, or we do not know."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "performance",
    title: "Reviewing and managing performance",
    purpose: "Whether performance and conduct are raised early and written down.",
    stakes:
      "A surprise ending, after months of silence, is difficult to defend. Early, specific feedback is also fairer.",
    keep: "Keep a short note of the conversation, the standard, and the date you will look again.",
    weight: 1.05,
    questions: [
      {
        id: "perf-reviews",
        prompt: "Are performance reviews held and documented?",
        why: "A review is where duties, pay, and development stay honest. An unrecorded chat disappears.",
        action:
          "Put a review date in the diary for each person this quarter. Use the position description. Write what was agreed.",
        choices: [
          solid("yes", "Yes. Reviews happen and the notes are kept."),
          thin("sometimes", "We talk, but it is irregular and not written down."),
          gap("no", "No."),
          unsure("unsure"),
        ],
      },
      {
        id: "perf-pip",
        prompt:
          "When performance slips, can you run a fair process, including a performance improvement plan where that is the right tool?",
        why: "The person needs the gap in observable terms, a chance to improve, and a review date. A plan that is vague will not help either of you.",
        action:
          "For anyone you are worried about, write the gap, meet them, agree what better looks like, and diary the review. Keep the note.",
        choices: [
          solid("yes", "Yes. The process is fair, and we have used it."),
          thin("avoid", "We know we should. We have not really done it."),
          gap("no", "We would not know how to run that process."),
          unsure("unsure"),
        ],
      },
      {
        id: "perf-conduct",
        prompt:
          "Do you have a clear way to deal with conduct such as repeated lateness, language, presentation, or misuse of equipment?",
        why: "These issues are ordinary, and they get worse when every manager invents a different response.",
        action:
          "Write the standard for the one conduct issue you see most. Tell managers the first conversation: what happened, what the standard is, and what happens if it continues.",
        choices: [
          solid("yes", "Yes. The standard is clear and managers follow it."),
          partial("some", "Some managers handle it. Others avoid it."),
          gap("no", "We put up with it, or we come down hard with no record."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "training",
    title: "Training and development",
    purpose: "Whether people keep learning after the first week.",
    stakes:
      "Training that stops at induction leaves the business dependent on one or two people, and it shows up later as errors and turnover.",
    keep: "Tie at least one development action to each performance review.",
    weight: 0.95,
    questions: [
      {
        id: "train-after",
        prompt: "Does training continue after someone starts, or does it stop once they can do the basics?",
        why: "Day-one training gets people safe and useful. It does not build the next job, or fix a changed system.",
        action:
          "List the skills the business will need in the next year. Next to each, name who has it and who is learning it. Book one piece of training that is not only for new starters.",
        choices: [
          solid("yes", "Yes. Training continues, including for skill and succession."),
          partial("systems", "We train when a system changes, and not much otherwise."),
          gap("start", "We train people when they start, and very little after that."),
          unsure("unsure"),
        ],
      },
      {
        id: "train-probation",
        prompt:
          "Do you understand probation and the qualifying period, including how to end employment or extend probation properly?",
        why: "Probation in a contract is not the same as the unfair dismissal qualifying period. Getting the end of probation wrong is a common claim.",
        action:
          "Write the probation length from the contract next to the unfair dismissal qualifying period for your size of business. Diary a review before probation ends, not after.",
        choices: [
          solid("yes", "Yes. Managers know both, and probation is reviewed before it ends."),
          thin("contract", "The contract mentions probation. We have not really used it."),
          gap("no", "We are not familiar with how this works."),
          unsure("unsure"),
        ],
      },
      {
        id: "train-payreview",
        prompt: "Do you review wages each year so pay still matches the work and the market you hire in?",
        why: "An award increase is a legal floor. A wage that never moves for the work the person now does is how you lose people, and how classifications fall behind.",
        action:
          "Once a year, after the annual wage review, look at each role: award level, what they are paid, and whether the duties have grown. Adjust the ones that have.",
        choices: [
          solid("yes", "Yes. We review pay each year against the role."),
          thin("award", "We update award rates. We do not look at whether the job has changed."),
          gap("no", "Pay is set at hire and left there."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "culture",
    title: "Culture and engagement",
    purpose: "Whether people stay, and whether the workplace is one they can stay in.",
    stakes:
      "Turnover is expensive, and it is usually telling you something about the work, the manager, or the pay. Wellbeing that is only hoped for does not change it.",
    keep: "Ask, in an ordinary meeting, what in the work is wearing people down, and change one thing.",
    weight: 0.95,
    questions: [
      {
        id: "culture-turnover",
        prompt: "Do you know why people leave, and whether you can replace them without a crisis?",
        why: "If good people are hard to keep and you do not know why, recruiting harder will not fix it.",
        action:
          "For the last three leavers, write why they left in their words if you have them. If you do not, ask the next person in an exit conversation. Look for a pattern before you rewrite an ad.",
        choices: [
          solid("yes", "Yes. Departures are understood, and replacing people is manageable."),
          partial("busy", "We cope, but we do not really look at why people go."),
          gap("no", "We are struggling to keep people and do not know why."),
          unsure("unsure"),
        ],
      },
      {
        id: "culture-wellbeing",
        prompt: "Is wellbeing part of how the business is run, or only something you talk about when someone is already struggling?",
        why: "Workload, rosters, and how managers speak to people are the levers. A social event does not replace them.",
        action:
          "Name one work design choice that is wearing people down — span of hours, staffing, or customer abuse — and change it this month.",
        choices: [
          solid("yes", "Yes. We pay attention to workload and support, not only to social events."),
          partial("events", "We mark birthdays and wins. The work itself is rarely examined."),
          gap("no", "Wellbeing is not something we have organised."),
          unsure("unsure"),
        ],
      },
      {
        id: "culture-change",
        prompt: "If you were making a major change, would you consult the people affected before you decided?",
        why: "Consultation is required for major change in most awards and agreements. It also stops a change landing as a surprise.",
        action:
          "Before the next significant change to hours, structure, or duties, write who is affected, what you will tell them, and what feedback you will take before the decision is final.",
        choices: [
          solid("yes", "Yes. We know how to consult, and we do it before the decision is locked."),
          thin("tell", "We tell people once we have decided."),
          gap("no", "We would not be prepared for that."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "records",
    title: "Record keeping",
    purpose: "Whether you could produce the records if you were asked this week.",
    stakes:
      "Employee records generally must be kept for 7 years. If you cannot produce them, the conversation starts in the employee's favour.",
    keep: "Once a quarter, open one current file and one leaver's file and check the contract, hours, and leave are still there.",
    weight: 1.15,
    questions: [
      {
        id: "records-produce",
        prompt:
          "Could you produce, this week, a contract, recent payslips, hours, leave applications, and any deduction approvals for any employee?",
        why: "Deductions need agreement in writing before they are taken. Hours need to include breaks where the award requires a timesheet. A search through an inbox is not a system.",
        action:
          "Pick an employee at random, including someone who has left. Time how long it takes to find the contract, the last three payslips, the hours, and any deduction approval. If it is slow, fix the filing before anything else in this section.",
        choices: [
          solid("yes", "Yes. Those records are in one place, including written deduction approvals."),
          partial("slow", "We could find them, but it would be a search. Breaks or deductions may be missing."),
          gap("no", "Some of those records do not exist."),
          unsure("unsure"),
        ],
      },
      {
        id: "records-seven",
        prompt: "Are time and wage records kept for at least 7 years, including for people who have left?",
        why: "Deleting a leaver's file when they walk out removes the record you may need, and it breaks the Fair Work retention rule.",
        action: "Stop deleting leaver files. Keep payroll and contract records for 7 years, including backups.",
        choices: [
          solid("yes", "Yes. Current and former employee records are kept for 7 years."),
          partial("current", "Current staff are fine. Leavers are deleted or lost."),
          gap("no", "We do not have a retention rule."),
          unsure("unsure"),
        ],
      },
      {
        id: "records-leave",
        prompt:
          "Are leave balances, including long service leave and any portable scheme in your industry, tracked and visible?",
        why: "Long service leave is state and territory law. Some industries also have portable schemes. Excessive annual leave has its own rules about directing people to take it. A shutdown over Christmas can force leave only with the notice the award requires.",
        action:
          "Add a long-service start date to each record and check the qualifying period, and any portable scheme, for your state and industry. Make annual leave balances visible to the person who approves leave. Before a Christmas shutdown, check the notice the award requires.",
        choices: [
          solid("yes", "Yes. Balances, long service leave, and any portable scheme are tracked."),
          thin("annual", "Annual leave is in the payroll system. Long service leave is not."),
          gap("no", "We do not really track leave."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "exits",
    title: "Employee exits",
    purpose: "Whether people leave with the right notice, pay, and reason on file.",
    stakes:
      "Final pay is not discretionary. A dismissal without a fair process, or a redundancy that is not genuine, is the usual path to a claim.",
    keep: "Use a last-pay checklist on every exit, including resignations.",
    weight: 1.1,
    questions: [
      {
        id: "exits-notice",
        prompt:
          "When someone leaves, do they receive the correct notice or payment in lieu, outstanding pay and leave, and a record of why?",
        why: "Notice comes from the contract, the award, and the National Employment Standards. A missing reason makes a later claim harder to answer.",
        action:
          "Make a last-pay checklist: notice, annual leave, time off in lieu, outstanding hours, super on the final pay, and company property. Use it on the next exit.",
        choices: [
          solid("yes", "Yes. Final pay, notice, and the reason are handled on a checklist."),
          partial("pay", "We pay them out. The paperwork is thin."),
          gap("no", "Exits are informal."),
          unsure("unsure"),
        ],
      },
      {
        id: "exits-redundancy",
        prompt: "Do you know what a genuine redundancy is, and when consultation has to happen first?",
        why: "A redundancy is about the job no longer being required, not about the person. Skipping consultation can turn it into an unfair dismissal.",
        action:
          "Before the next redundancy, write why the job is no longer required, who you will consult, and whether a redeployment was considered. Check the notice and redundancy pay for your size of business.",
        choices: [
          solid("yes", "Yes. We understand genuine redundancy and we consult."),
          thin("rough", "We know the term. We have not applied it carefully."),
          gap("no", "No."),
          unsure("unsure"),
        ],
      },
      {
        id: "exits-dismissal",
        prompt:
          "If you dismiss someone, do you follow the Small Business Fair Dismissal Code where it applies, or a fair process if you are larger — and do you know an unfair dismissal from a general protections claim?",
        why: "Under 15 employees, the Small Business Fair Dismissal Code is the reference, and redundancy pay under the National Employment Standards usually does not apply. Larger employers need a reason and a chance to respond. Adverse action is a different claim from unfair dismissal.",
        action:
          "Before the next dismissal, write the reason, the warnings or the serious misconduct, and the chance the person had to respond. If you have fewer than 15 employees, read the Small Business Fair Dismissal Code first. If the person has raised a workplace right, get advice before you act.",
        choices: [
          na("na", "This does not apply. We have 15 or more employees and use a fuller process, which we follow."),
          solid("yes", "Yes. We follow the right process for our size, and we keep the record."),
          gap("small-unsure", "We have fewer than 15 employees and do not understand these rules."),
          gap("no", "We decide and tell them, and we would not know one claim from the other."),
          unsure("unsure"),
        ],
      },
    ],
  },
  {
    id: "psychosocial",
    title: "Psychosocial risk and positive duty",
    purpose: "Psychological health, sexual harassment, and support when someone is at risk.",
    stakes:
      "Safety duties include psychological health. The positive duty requires reasonable steps to prevent sexual harassment and a hostile workplace, not only a response after a complaint.",
    keep: "Ask what in the work is causing harm, and change the work. Keep a report path that does not go only through the person complained about.",
    weight: 1.3,
    questions: [
      {
        id: "psycho-hazards",
        prompt:
          "Have you named the psychosocial hazards in this workplace — workload, poor support, aggression, bullying — and changed the work where you needed to?",
        why: "Telling someone to be more resilient, while the roster stays unsafe, does not meet the duty. An employee assistance program helps a person. It does not replace fixing the hazard.",
        action:
          "Write the five hazards most likely here. Ask two people if the list is fair. For the top one, change something concrete: staffing, roster, client handling, or how a manager speaks to the team. If you have no support path for a mental health concern, decide this month whether that is an assistance program, a trained manager, or both.",
        choices: [
          solid("yes", "Yes. Hazards are named, the work has changed where it needed to, and people have a support path."),
          partial("talk", "We talk about stress. The hazards are not written down, and support is informal."),
          gap("no", "We have not looked at psychological hazards, and there is no support path."),
          unsure("unsure"),
        ],
      },
      {
        id: "psycho-harass",
        prompt:
          "Would you know what to do if there was a sexual harassment complaint at work or at a work function, and can it be reported to someone other than the person complained about?",
        why: "The positive duty is about prevention and a real reporting path. A complaint that can only go to the person involved will not be made.",
        action:
          "Name an alternative reporting path this week, even if it is a second manager. Tell staff in writing. Agree that a complaint about a peer, a manager, a client, or a work function is acted on, not parked.",
        choices: [
          solid("yes", "Yes. We know the steps, and there is an alternative reporting path."),
          partial("policy", "We would try to deal with it. Reporting still goes through one person."),
          gap("no", "We would not know what to do."),
          unsure("unsure"),
        ],
      },
      {
        id: "psycho-fdv",
        prompt:
          "Do you understand paid family and domestic violence leave, and is there something practical you can do if a person needs it?",
        why: "Eligible employees have 10 days of paid family and domestic violence leave. How you respond, and who they can tell, matters as much as the entitlement.",
        action:
          "Tell managers the entitlement in one paragraph: 10 days paid, what evidence you can reasonably ask for, and that confidentiality is part of the response. Name who a person can talk to.",
        choices: [
          solid("yes", "Yes. Managers know the entitlement and there is a private way to ask for support."),
          thin("heard", "We have heard of it. We would be guessing on the day."),
          gap("no", "We do not understand this well enough to respond."),
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
  { id: "covered", label: "Most roles are covered by a modern award" },
  { id: "mixed", label: "A mix of award-covered and award-free roles" },
  { id: "agreement", label: "An enterprise agreement covers the team" },
  { id: "award-free", label: "We have checked, and the roles are award-free" },
  { id: "unsure", label: "I'm not sure what covers us" },
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
