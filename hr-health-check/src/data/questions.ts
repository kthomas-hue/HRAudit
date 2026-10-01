export type QuestionType = 'scale' | 'yesno' | 'single' | 'multi' | 'text'

export interface ScaleConfig {
  min: number
  max: number
  minLabel: string
  maxLabel: string
  /** Optional per-value descriptions shown so leaders know what each number means */
  stepLabels?: string[]
}

export interface ChoiceOption {
  id: string
  label: string
  /** 0–100 contribution for this option */
  score: number
  /** If true, selecting this on multi reduces score / is a gap indicator */
  isGap?: boolean
}

export interface Question {
  id: string
  categoryId: string
  prompt: string
  helpText?: string
  type: QuestionType
  required?: boolean
  scale?: ScaleConfig
  options?: ChoiceOption[]
  /** For yes/no: score when Yes */
  yesScore?: number
  noScore?: number
  placeholder?: string
}

export interface Category {
  id: string
  name: string
  shortName: string
  description: string
  accent: string
}

export const categories: Category[] = [
  {
    id: 'pay',
    name: 'Pay & Entitlements',
    shortName: 'Pay',
    description: 'Awards, NES, pay rates, allowances and statutory entitlements.',
    accent: '#8B6CE7',
  },
  {
    id: 'contracts',
    name: 'Employment Contracts',
    shortName: 'Contracts',
    description: 'Agreements, statements and essential contract inclusions.',
    accent: '#5B7FEF',
  },
  {
    id: 'recruitment',
    name: 'Recruitment & Talent',
    shortName: 'Recruitment',
    description: 'Advertising, interviews and fair hiring practices.',
    accent: '#E54771',
  },
  {
    id: 'onboarding',
    name: 'New Hires & Onboarding',
    shortName: 'Onboarding',
    description: 'What new starters receive in their first days.',
    accent: '#FF7A2F',
  },
  {
    id: 'policies',
    name: 'Policies & Procedures',
    shortName: 'Policies',
    description: 'Handbooks, acknowledgement and consistent enforcement.',
    accent: '#1FC4B4',
  },
  {
    id: 'whs',
    name: 'Workplace Health & Safety',
    shortName: 'WHS',
    description: 'Insurance, first aid, emergencies and injury response.',
    accent: '#B4E717',
  },
  {
    id: 'performance',
    name: 'Reviewing & Managing Performance',
    shortName: 'Performance',
    description: 'Reviews, probation, PIPs and day-to-day conduct.',
    accent: '#F1C642',
  },
  {
    id: 'training',
    name: 'Training & Development',
    shortName: 'Training',
    description: 'Skill building, succession and awareness campaigns.',
    accent: '#8B6CE7',
  },
  {
    id: 'culture',
    name: 'Culture & Engagement',
    shortName: 'Culture',
    description: 'Retention, wellbeing and how you celebrate people.',
    accent: '#E54771',
  },
  {
    id: 'records',
    name: 'Record Keeping',
    shortName: 'Records',
    description: 'Employee files, leave records and documentation.',
    accent: '#5B7FEF',
  },
  {
    id: 'exits',
    name: 'Employee Exits',
    shortName: 'Exits',
    description: 'Termination, redundancy and consultation readiness.',
    accent: '#1C4842',
  },
  {
    id: 'psychosocial',
    name: 'Psychosocial Risk & Positive Duty',
    shortName: 'Psychosocial',
    description: 'Harassment, mental health, FDV leave and serious risk.',
    accent: '#E54771',
  },
  {
    id: 'ai',
    name: 'AI at Work',
    shortName: 'AI',
    description: 'Where AI shows up in people work — clarity, guardrails, and readiness.',
    accent: '#1FC4B4',
  },
]

export const questions: Question[] = [
  // —— Pay & Entitlements ——
  {
    id: 'pay-fwa-familiarity',
    categoryId: 'pay',
    type: 'scale',
    prompt: 'How familiar are you with the Fair Work Act and Modern Awards?',
    scale: { min: 1, max: 10, minLabel: 'Not familiar at all', maxLabel: 'Very familiar' },
  },
  {
    id: 'pay-nes-comfort',
    categoryId: 'pay',
    type: 'scale',
    prompt: 'How comfortable are you with the National Employment Standards and how they apply to your employees?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'I am not aware of what this is',
      maxLabel: 'I know what these are and am confident that we are compliant with all standards',
    },
  },
  {
    id: 'pay-award-classification',
    categoryId: 'pay',
    type: 'scale',
    prompt:
      'How confident are you that each of your employees is covered by the correct Modern Award, including the correct Award classification and level?',
    helpText:
      'Keeping in mind that different Modern Awards may apply to different occupations within the same business.',
    scale: {
      min: 1,
      max: 10,
      minLabel: "I'm not confident, this is a concern for my business",
      maxLabel: 'Fully comfortable — I know my Award alignment is 100% accurate',
    },
  },
  {
    id: 'pay-above-award',
    categoryId: 'pay',
    type: 'single',
    prompt:
      'Are you aware that if you pay above the Award, other conditions and entitlements within the Award are still applicable?',
    options: [
      { id: 'a', label: 'Yes, I am aware of this and am compliant', score: 100 },
      { id: 'b', label: 'Yes, I am aware but am unsure if I am meeting all the conditions', score: 55 },
      {
        id: 'c',
        label: "I thought if I paid above the Award this meant I didn't need to worry about other Award conditions",
        score: 10,
      },
    ],
  },
  {
    id: 'pay-statutory',
    categoryId: 'pay',
    type: 'single',
    prompt:
      'Each Award will determine minimum rates of pay, penalty rates, hours of work, overtime, meal breaks, and other statutory entitlements. How confident are you that you are paying in line with the Award requirements for these statutory entitlements?',
    options: [
      { id: 'a', label: 'I am unsure of the statutory entitlements', score: 10 },
      {
        id: 'b',
        label: "I am paying above the Award so believed that I wasn't required to pay any other statutory entitlements",
        score: 15,
      },
      {
        id: 'c',
        label: 'I am aware of the minimum rates of pay and I am compliant; however other entitlements need a review',
        score: 60,
      },
      {
        id: 'd',
        label: 'I am paying statutory entitlements including minimum rates of pay in line with the Award requirements',
        score: 100,
      },
    ],
  },
  {
    id: 'pay-allowances',
    categoryId: 'pay',
    type: 'single',
    prompt: 'How would you rate your compliance with Modern Award allowances?',
    options: [
      { id: 'a', label: "I know I need to pay allowances but it's too confusing so we are not paying them", score: 5 },
      { id: 'b', label: 'I know I need to pay allowances, just unsure which ones and when', score: 30 },
      { id: 'c', label: 'I pay a flat hourly rate that I believe is enough to cover all allowances', score: 40 },
      {
        id: 'd',
        label: "I am paying some allowances; however, could use a quick review to make sure it's all correct",
        score: 70,
      },
      { id: 'e', label: 'I am 100% confident that we are compliant in this area', score: 100 },
    ],
  },
  {
    id: 'pay-employment-types',
    categoryId: 'pay',
    type: 'scale',
    prompt:
      'How well do you believe you understand the differences between full time, part time and casual employment, including probation, leave, and termination requirements?',
    scale: { min: 1, max: 10, minLabel: 'Not well at all', maxLabel: 'I am aware of all of the differences' },
  },
  {
    id: 'pay-better-off',
    categoryId: 'pay',
    type: 'scale',
    prompt:
      'If any of your employees are paid a flat rate or annual salary, are the arrangements you pay them better than what the employee/s would be entitled to if you paid as per the Award hourly rate and other applicable entitlements?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "I'm not sure — I have never checked this",
      maxLabel: 'We review this annually and are confident our flat rate and salaried employees are better off overall',
    },
  },
  {
    id: 'pay-annualised',
    categoryId: 'pay',
    type: 'single',
    prompt:
      'With your annual salaried/flat rate employees do you have an annualised salary agreement in place which shows your employees how their annual salary (or flat rate) is calculated?',
    options: [
      { id: 'a', label: 'I am not sure what this is, so we would not be doing this', score: 5 },
      {
        id: 'b',
        label:
          'I tell staff what they would be paid under the Award and compare it to what their annual salary is that I pay them, but that is all',
        score: 45,
      },
      {
        id: 'c',
        label:
          'I show staff an itemised table of how I calculated their annual salary/flat rate and this shows how they are compensated more than the Award requires (and by how much)',
        score: 100,
      },
    ],
  },
  {
    id: 'pay-timesheets',
    categoryId: 'pay',
    type: 'single',
    prompt: 'Do your staff complete timesheets?',
    helpText: "This applies only to those staff who are not considered 'Off Award' or 'Award Free'.",
    options: [
      { id: 'a', label: 'No timesheets are kept', score: 5 },
      { id: 'b', label: 'Staff work according to a roster and do not work outside of rostered hours', score: 50 },
      { id: 'c', label: 'Staff document their hours but not their breaks', score: 55 },
      { id: 'd', label: 'Staff document their hours and their lunchbreaks in a timesheet / app', score: 100 },
    ],
  },
  {
    id: 'pay-payslip-timing',
    categoryId: 'pay',
    type: 'yesno',
    prompt: 'Are you issuing a payslip to each staff member within one working day after their pay is processed?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'pay-payslip-detail',
    categoryId: 'pay',
    type: 'yesno',
    prompt: 'Do your payslips separate base pay, allowances, overtime and penalty rates?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'pay-pay-cycle',
    categoryId: 'pay',
    type: 'yesno',
    prompt:
      'Are you confident that your pay arrangements (weekly, fortnightly, monthly) and day of pay (Mon–Fri) comply with the Award?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'pay-deductions',
    categoryId: 'pay',
    type: 'single',
    prompt:
      'If you make a deduction from an employee’s pay, do you obtain their approval in writing prior to the deduction?',
    helpText:
      'E.g. in the case of an overpayment or employee repaying an amount the employer paid on their behalf.',
    options: [
      { id: 'a', label: "No, we don't / wouldn't obtain this prior", score: 0 },
      { id: 'b', label: "We tell employees but we don't have anything in writing", score: 20 },
      { id: 'c', label: 'We get approval in writing for overpayments but not for anything else', score: 45 },
      {
        id: 'd',
        label: "We inform employees via email prior to any deductions but they don't need to approve it",
        score: 40,
      },
      { id: 'e', label: 'We have employees sign / approve all deductions prior to processing', score: 100 },
    ],
  },
  {
    id: 'pay-pt-hours',
    categoryId: 'pay',
    type: 'scale',
    prompt:
      'Do you have part time employees whose hours change from week to week? Are you aware of and complying with overtime payments for these employees?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'We have part time staff whose hours change depending on their availability / our requirements from week to week',
      maxLabel: 'All changes to part time hours are documented in variation letters and recorded',
    },
  },
  {
    id: 'pay-leave-loading',
    categoryId: 'pay',
    type: 'yesno',
    prompt:
      'Are you paying leave loading as appropriate under the Award? If you have included this loading into a salary or hourly amount, is that clear in the contract?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'pay-plsl',
    categoryId: 'pay',
    type: 'scale',
    prompt:
      'Are you aware if there is a state Portable Long Service Leave (PLSL) requirement for your industry, and how to use it? Are you confident you can calculate long service leave for staff whether they are affected by PLSL or not?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "I don't know what this is or how to do LSL calculations",
      maxLabel: 'We are registered for PLSL where required, and know how to do a calculation',
    },
  },

  // —— Employment Contracts ——
  {
    id: 'contracts-pd',
    categoryId: 'contracts',
    type: 'multi',
    prompt:
      'Position Descriptions provide an overview of roles, including duties, inherent requirements, responsibilities, reporting lines, and often key performance indicators. From the below, choose all that apply.',
    options: [
      { id: 'a', label: 'We do not have Position Descriptions', score: 0, isGap: true },
      {
        id: 'b',
        label: 'Only some staff have Position Descriptions, or the ones in place are not comprehensive',
        score: 25,
        isGap: true,
      },
      {
        id: 'c',
        label: 'Position Descriptions are regularly reviewed to be sure they accurately reflect role requirements',
        score: 100,
      },
      { id: 'd', label: 'Position Descriptions are aligned with the relevant Award classifications', score: 100 },
      {
        id: 'e',
        label: 'Position Descriptions are written based on business requirements, rather than on the incumbent',
        score: 100,
      },
      { id: 'f', label: 'Position Descriptions contain no more than six role related responsibilities', score: 100 },
    ],
  },
  {
    id: 'contracts-issued',
    categoryId: 'contracts',
    type: 'yesno',
    prompt: 'Are all staff issued with an Employment Agreement / Contract?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'contracts-contents',
    categoryId: 'contracts',
    type: 'multi',
    prompt: 'Do your Employment Agreements contain any or all of the below (please check all that apply):',
    options: [
      { id: 'a', label: 'Relevant Modern Award and classification (where applicable)', score: 100 },
      { id: 'b', label: 'Hours of work', score: 100 },
      { id: 'c', label: 'Wages / Salary, inclusions and an expectation of reasonable overtime', score: 100 },
      { id: 'd', label: 'Acceptable behaviour standards', score: 100 },
      { id: 'e', label: 'Probationary period', score: 100 },
      { id: 'f', label: 'License / registration requirements (blue cards, drivers’ license etc.)', score: 100 },
      { id: 'g', label: 'Leave entitlements', score: 100 },
      { id: 'h', label: 'Notice periods for employee and employer (following NES where required)', score: 100 },
      { id: 'i', label: 'Redundancy', score: 100 },
      { id: 'j', label: 'Confidential information', score: 100 },
      { id: 'k', label: 'Intellectual Property', score: 100 },
      { id: 'l', label: 'Post employment obligations', score: 100 },
    ],
  },
  {
    id: 'contracts-fwis',
    categoryId: 'contracts',
    type: 'yesno',
    prompt: 'Do you issue the Fair Work Information Statement to new staff?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'contracts-ceis',
    categoryId: 'contracts',
    type: 'yesno',
    prompt: 'Do you issue the Casual Employment Information Statement to casual staff?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'contracts-variations',
    categoryId: 'contracts',
    type: 'yesno',
    prompt:
      'Are variation letters issued when changes are made to employment agreements? (e.g. higher duties, change of hours, reporting lines)',
    yesScore: 100,
    noScore: 0,
  },

  // —— Recruitment & Talent ——
  {
    id: 'recruit-ads',
    categoryId: 'recruitment',
    type: 'yesno',
    prompt:
      'Are you comfortable that your job advertisements appropriately reflect role requirements, and relate directly to the Position Description?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'recruit-practices',
    categoryId: 'recruitment',
    type: 'scale',
    prompt: "How would you rate your organisation's recruitment and interview practices?",
    scale: {
      min: 1,
      max: 10,
      minLabel: 'This is not a strong point for our business',
      maxLabel: 'We have consistent, fair and transparent processes, with high acceptance rates',
    },
  },
  {
    id: 'recruit-interview',
    categoryId: 'recruitment',
    type: 'multi',
    prompt: 'Select all options from the below that apply to your interview process.',
    helpText:
      'Interviews are an opportunity for both the business and candidate to see if they are a good fit together. Compliance measures matter for transparency, performance management and FOI purposes.',
    options: [
      { id: 'a', label: 'All applicants are asked the same questions', score: 100 },
      { id: 'b', label: 'Questions are behaviour based, and related directly to the role requirements', score: 100 },
      {
        id: 'c',
        label: 'Applicants are assessed against the essential qualifications, skills, experience and attributes',
        score: 100,
      },
      {
        id: 'd',
        label: 'Unsuccessful applicants that were not interviewed receive an email response thanking them for their application',
        score: 100,
      },
      {
        id: 'e',
        label: 'Unsuccessful shortlisted applicants who were interviewed receive a phone call',
        score: 100,
      },
      { id: 'f', label: 'We are aware of what questions should and should not be asked at interview', score: 100 },
      {
        id: 'g',
        label: 'When contacting referees, permission is sought regarding applicant access to their feedback',
        score: 100,
      },
      {
        id: 'h',
        label: 'Documentation is collected from all interviewers and kept on file after any interview process',
        score: 100,
      },
    ],
  },

  // —— Onboarding ——
  {
    id: 'onboard-training',
    categoryId: 'onboarding',
    type: 'multi',
    prompt: 'When new employees start with your business, what information and training is provided? Please choose all that apply.',
    options: [
      { id: 'a', label: 'Workplace Health & Safety', score: 100 },
      { id: 'b', label: 'Bullying & Harassment', score: 100 },
      { id: 'c', label: 'Accessing the worksite', score: 100 },
      { id: 'd', label: 'Incident reporting', score: 100 },
      {
        id: 'e',
        label: 'Internal policies and procedures, including how to access them',
        score: 100,
      },
      { id: 'f', label: 'Expectations around hours', score: 100 },
      { id: 'g', label: 'Appropriate uniform or dress requirements', score: 100 },
      { id: 'h', label: 'IT / systems access and policies', score: 100 },
      { id: 'i', label: 'Staff introductions', score: 100 },
    ],
  },
  {
    id: 'onboard-contractor',
    categoryId: 'onboarding',
    type: 'yesno',
    prompt:
      "Do you know the difference between an employee and a contractor, and understand the implications of 'sham contracting'?",
    helpText: "Please choose 'Yes' if you do not have any contractors and don't intend to engage any in the future.",
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'onboard-visa',
    categoryId: 'onboarding',
    type: 'yesno',
    prompt: 'Do you undertake work rights / visa entitlement verification for any staff without Australian citizenship?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'onboard-casual-conversion',
    categoryId: 'onboarding',
    type: 'single',
    prompt:
      "Are you aware of your obligations regarding casual employees' rights to request permanent employment (casual conversion) under the legislation?",
    options: [
      {
        id: 'a',
        label:
          'Yes, but this does not apply to our business as we do not have casual staff or fall within the exemption criteria.',
        score: 100,
      },
      {
        id: 'b',
        label: "I'm uncertain about how these changes apply to us, and this is a concern for my business.",
        score: 20,
      },
      {
        id: 'c',
        label:
          'We have received verbal requests from casual employees but do not maintain written records of these requests and our responses.',
        score: 35,
      },
      {
        id: 'd',
        label:
          "We acknowledge and respond to eligible casual employees' requests for permanent employment in writing, in line with the legal requirements.",
        score: 100,
      },
    ],
  },

  // —— Policies ——
  {
    id: 'policies-comprehensive',
    categoryId: 'policies',
    type: 'scale',
    prompt: 'How comprehensive do you believe your employment relations policies are within your business?',
    helpText:
      'Policies and procedures help staff and managers know what is expected, how to conduct themselves, and what happens when rules are not followed.',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'No policies in place',
      maxLabel: 'We have a full, comprehensive handbook, which is accessible by staff and kept up to date',
    },
  },
  {
    id: 'policies-ack',
    categoryId: 'policies',
    type: 'yesno',
    prompt: 'Do staff acknowledge their acceptance of policies in writing, and any changes to them?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'policies-followed',
    categoryId: 'policies',
    type: 'scale',
    prompt: 'Are policies consistently followed by staff, and enforced by management?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'Policies are rarely adhered to',
      maxLabel: 'Policies are always followed, and managers ensure compliance',
    },
  },

  // —— WHS ——
  {
    id: 'whs-insurance',
    categoryId: 'whs',
    type: 'yesno',
    prompt: 'Do you have Workers Compensation insurance?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'whs-claim',
    categoryId: 'whs',
    type: 'scale',
    prompt: "How well do you understand what to do in the event of a staff injury and worker's compensation claim?",
    scale: {
      min: 1,
      max: 10,
      minLabel: 'Not at all',
      maxLabel: 'We have return to work policies and understand our obligations around reasonable adjustments',
    },
  },
  {
    id: 'whs-evac',
    categoryId: 'whs',
    type: 'yesno',
    prompt: 'Do you have policies and procedures in place around evacuation in the event of fire or other emergency?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'whs-firstaid',
    categoryId: 'whs',
    type: 'yesno',
    prompt: 'Are there an adequate number of people trained in First Aid / CPR for your business?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'whs-shutdown',
    categoryId: 'whs',
    type: 'yesno',
    prompt:
      'If you shut down over the Christmas / New Year period, are you aware of the requirements under the relevant Award/s for notice and forced leave?',
    yesScore: 100,
    noScore: 0,
  },

  // —— Performance ——
  {
    id: 'perf-reviews',
    categoryId: 'performance',
    type: 'yesno',
    prompt: 'Are formal performance reviews undertaken and documented?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'perf-probation',
    categoryId: 'performance',
    type: 'scale',
    prompt:
      'How well do you feel you know the requirements around probation and qualifying periods, including terminations and extensions?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'Not familiar at all',
      maxLabel: 'Very comfortable with how to handle probation and their relationship with qualifying periods',
    },
  },
  {
    id: 'perf-pip',
    categoryId: 'performance',
    type: 'scale',
    prompt:
      'How confident are you in addressing performance management issues, including a Performance Improvement Plan (PIP)?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "I've never undertaken a performance management process or wouldn't know how",
      maxLabel: 'I am confident that our processes are fair, reasonable and clear',
    },
  },
  {
    id: 'perf-conduct',
    categoryId: 'performance',
    type: 'scale',
    prompt:
      'How confident are you managing conduct issues, such as regular lateness, bad language, poor presentation or misuse of company equipment?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'We would not be comfortable holding these conversations',
      maxLabel: 'We have clear procedures in place and know how to follow them',
    },
  },
  {
    id: 'perf-misconduct',
    categoryId: 'performance',
    type: 'scale',
    prompt:
      'How confident are you in addressing serious misconduct, such as theft, fraud, assault, intoxication in the workplace, sexual harassment or blatant breach of health and safety rules?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'We would not be comfortable addressing these issues',
      maxLabel: 'We are confident that we could handle these situations appropriately',
    },
  },

  // —— Training ——
  {
    id: 'train-approach',
    categoryId: 'training',
    type: 'multi',
    prompt: 'How does your business approach training and development? Please select all that apply.',
    options: [
      {
        id: 'a',
        label: 'We train staff when they first commence, but not very much thereafter',
        score: 30,
        isGap: true,
      },
      {
        id: 'b',
        label: 'We offer training as required for new systems / processes, based primarily around roles',
        score: 70,
      },
      {
        id: 'c',
        label:
          'We offer training based around skill requirements and succession planning, with a view to embedding flexible skills across functions',
        score: 100,
      },
    ],
  },
  {
    id: 'train-campaigns',
    categoryId: 'training',
    type: 'multi',
    prompt:
      'Do you participate in campaigns and initiatives to encourage awareness of health and safety, mental health, domestic violence and other important issues?',
    options: [
      { id: 'a', label: 'National Safe Work Month', score: 100 },
      { id: 'b', label: 'RUOK? Day', score: 100 },
      { id: 'c', label: 'Mental Health Week', score: 100 },
      { id: 'd', label: 'Domestic Violence Awareness Month', score: 100 },
      { id: 'e', label: 'World Mental Health Day', score: 100 },
    ],
  },

  // —— Culture ——
  {
    id: 'culture-turnover',
    categoryId: 'culture',
    type: 'scale',
    prompt: 'How comfortable are you with your staff turnover?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "We're struggling to find and keep good staff and have no understanding of the issues",
      maxLabel: 'Our staff tenure is genuine and we have little difficulty finding replacements',
    },
  },
  {
    id: 'culture-events',
    categoryId: 'culture',
    type: 'yesno',
    prompt: 'Do you have social functions and / or celebrate events (i.e. birthdays, business success)?',
    yesScore: 100,
    noScore: 20,
  },
  {
    id: 'culture-wellbeing',
    categoryId: 'culture',
    type: 'scale',
    prompt: 'How would you rate your business in terms of employee wellbeing and culture?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'We focus mostly on compliance',
      maxLabel: 'We focus heavily on wellbeing, engagement, and professional development',
    },
  },
  {
    id: 'culture-wages-review',
    categoryId: 'culture',
    type: 'yesno',
    prompt: 'Do you review employee wages annually to ensure they are competitive and aligned with performance?',
    yesScore: 100,
    noScore: 15,
  },

  // —— Records ——
  {
    id: 'records-complete',
    categoryId: 'records',
    type: 'scale',
    prompt:
      'How confident are you that your employee records are complete, including evidence of all pay deductions, variations, leave applications, licenses and legislative requirements?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "We don't keep records",
      maxLabel: 'We have comprehensive records which are kept for 7 years',
    },
  },
  {
    id: 'records-leave',
    categoryId: 'records',
    type: 'yesno',
    prompt: 'Do you maintain a record of leave entitlements, and make them accessible to employees?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'records-leave-accrual',
    categoryId: 'records',
    type: 'scale',
    prompt:
      'How well do you believe you understand your obligations around excessive leave accruals, encouraging taking of leave, and leave payouts for excessive leave (not including at termination)?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "I'm not confident, this is a concern for my business",
      maxLabel: 'We handle these requirements following the Award',
    },
  },

  // —— Exits ——
  {
    id: 'exits-termination',
    categoryId: 'exits',
    type: 'yesno',
    prompt: 'Do you know what notice and documentation is required upon termination?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'exits-redundancy',
    categoryId: 'exits',
    type: 'yesno',
    prompt: 'Do you believe you have a good understanding of what constitutes a genuine redundancy?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'exits-consultation',
    categoryId: 'exits',
    type: 'scale',
    prompt: 'How prepared do you feel your business is to undertake workplace consultation for major changes?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'We are not prepared. This is a concern for the business',
      maxLabel: 'We understand how to conduct a full workplace consultation',
    },
  },
  {
    id: 'exits-small-business',
    categoryId: 'exits',
    type: 'single',
    prompt:
      'If you are a small business of under 15 employees, do you have a good understanding of how redundancies and the Small Business Fair Dismissal Code apply to your business?',
    options: [
      { id: 'a', label: 'This does not apply to our business as we are larger than 15 staff', score: 100 },
      {
        id: 'b',
        label: 'We are under 15 staff and do not have a good understanding of how to use these provisions',
        score: 15,
      },
      {
        id: 'c',
        label: 'We are under 15 staff and are comfortable with how these apply to our business',
        score: 100,
      },
    ],
  },
  {
    id: 'exits-unfair-vs-adverse',
    categoryId: 'exits',
    type: 'yesno',
    prompt: 'Do you understand the difference between an unfair dismissal claim and adverse action?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'exits-unfair-confidence',
    categoryId: 'exits',
    type: 'scale',
    prompt: 'How confident are you that you could appropriately address an unfair dismissal claim?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'Not at all confident',
      maxLabel: 'We are confident that we could handle these situations appropriately',
    },
  },

  // —— Psychosocial ——
  {
    id: 'psy-ifa',
    categoryId: 'psychosocial',
    type: 'scale',
    prompt:
      'Do you know what an Individual Flexibility Arrangement is under the relevant Award, and how to implement one?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'We would not be comfortable implementing an IFA',
      maxLabel: 'We have IFAs in place and are confident they are correct',
    },
  },
  {
    id: 'psy-general-protections',
    categoryId: 'psychosocial',
    type: 'yesno',
    prompt: 'Do you know what is considered a General Protection under the Fair Work Act, and how to handle a claim?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'psy-sexual-harassment',
    categoryId: 'psychosocial',
    type: 'yesno',
    prompt: 'Would you know what to do in the event of a sexual harassment claim at work, or at a work function?',
    yesScore: 100,
    noScore: 0,
  },
  {
    id: 'psy-fdv',
    categoryId: 'psychosocial',
    type: 'scale',
    prompt:
      'Do you have a good understanding of Family and Domestic Violence Leave provisions, and what you can do to assist staff experiencing domestic violence?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'No, it would be useful to understand this better',
      maxLabel: 'We have useful policies, training and support practices in place',
    },
  },
  {
    id: 'psy-alcohol',
    categoryId: 'psychosocial',
    type: 'scale',
    prompt:
      'How well would your business respond to the inappropriate use of alcohol or drugs in the workplace? Do you have policies, procedures and training in place to address these concerns?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "We don't have anything in place",
      maxLabel: 'We have policies and training in place to address these concerns',
    },
  },
  {
    id: 'psy-eap',
    categoryId: 'psychosocial',
    type: 'scale',
    prompt:
      'Do your staff have access to an Employee Assistance Program (EAP)? How equipped do you believe your business is to handle a mental health concern in the workplace?',
    scale: {
      min: 1,
      max: 10,
      minLabel: "We don't have anything in place",
      maxLabel: 'Management are trained in Mental Health First Aid and staff have access to an EAP',
    },
  },

  // —— AI at Work ——
  {
    id: 'ai-clarity',
    categoryId: 'ai',
    type: 'scale',
    prompt:
      'How clear is your business about where AI is (and isn’t) used in people-related work — hiring, performance, admin, or day-to-day tools?',
    helpText:
      'Applies whether you are a small team experimenting with ChatGPT or a larger business rolling out AI tools. Clarity matters more than sophistication.',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'No shared view — people use whatever they find',
      maxLabel: 'We have a clear view of approved uses and what’s off-limits',
    },
  },
  {
    id: 'ai-use-cases',
    categoryId: 'ai',
    type: 'multi',
    prompt: 'Where is AI currently used (or being trialled) for people-related work in your business?',
    helpText: 'Select all that apply. “Not yet” is a valid answer — many strong businesses are still early.',
    options: [
      { id: 'none', label: 'Not yet — little or no AI use in people work', score: 55, isGap: true },
      { id: 'drafting', label: 'Drafting job ads, emails, policies or performance notes', score: 75 },
      { id: 'screening', label: 'Screening CVs, shortlisting or interview support', score: 70 },
      { id: 'scheduling', label: 'Rostering, scheduling or workforce planning tools', score: 80 },
      { id: 'chat', label: 'Staff or candidate chatbots / HR helpdesks', score: 75 },
      { id: 'analytics', label: 'People analytics, turnover or engagement insights', score: 80 },
      { id: 'ad-hoc', label: 'Ad hoc personal use only — no business approach', score: 25, isGap: true },
    ],
  },
  {
    id: 'ai-policy',
    categoryId: 'ai',
    type: 'single',
    prompt: 'Do you have any guidance for staff on acceptable AI use at work?',
    options: [
      {
        id: 'a',
        label: 'No — people use AI tools without any shared expectations',
        score: 10,
      },
      {
        id: 'b',
        label: 'Informal — we’ve talked about it, but nothing is written down',
        score: 40,
      },
      {
        id: 'c',
        label: 'Basic guidance exists (e.g. don’t paste confidential data) but it isn’t consistently applied',
        score: 65,
      },
      {
        id: 'd',
        label: 'Yes — clear written guidance that staff know about and we can point to',
        score: 100,
      },
    ],
  },
  {
    id: 'ai-people-decisions',
    categoryId: 'ai',
    type: 'scale',
    prompt:
      'If AI informs hiring, performance, pay, or other people decisions — how confident are you that those uses are fair, explainable, and privacy-safe?',
    helpText:
      'If you are not using AI for people decisions yet, rate how ready you would be to do so responsibly.',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'Not confident — we haven’t thought this through',
      maxLabel: 'Confident — uses are deliberate, reviewable, and privacy-aware',
    },
  },
  {
    id: 'ai-data',
    categoryId: 'ai',
    type: 'yesno',
    prompt:
      'Have you considered privacy and confidentiality when staff use AI tools with employee, candidate, or customer information?',
    yesScore: 100,
    noScore: 15,
  },
  {
    id: 'ai-capability',
    categoryId: 'ai',
    type: 'scale',
    prompt:
      'How ready are the people who hire and manage in your business to use AI tools responsibly — and to spot when AI output needs a human check?',
    scale: {
      min: 1,
      max: 10,
      minLabel: 'Not ready — no shared skills or expectations',
      maxLabel: 'Ready — people know when to use AI and when to verify',
    },
  },
]

export const feedbackQuestion: Question = {
  id: 'feedback',
  categoryId: 'ai',
  type: 'text',
  required: false,
  prompt:
    'You have completed your HR Health Check. Prior to submitting your results, please take a moment to let us know any feedback you have about this assessment, or if it made you consider any areas of your people foundations that you hadn’t previously. (Optional)',
  placeholder: 'Share any thoughts or reflections…',
}

export function getQuestionsForCategory(categoryId: string): Question[] {
  return questions.filter((q) => q.categoryId === categoryId)
}
