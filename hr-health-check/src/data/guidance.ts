export type RiskLevel = 'high' | 'moderate' | 'watch' | 'strong'

export interface CategoryGuidance {
  categoryId: string
  /** What this area protects / controls */
  stakes: string
  /** Business risk if weak */
  riskIfWeak: string
  /** Concrete next move for a leader */
  nextMove: string
  /** Suggested DreamStone conversation angle */
  partnerAngle: string
}

export const categoryGuidance: Record<string, CategoryGuidance> = {
  pay: {
    categoryId: 'pay',
    stakes: 'Correct pay, awards, and entitlements are non-negotiable under Fair Work.',
    riskIfWeak:
      'Underpayment exposure, Fair Work claims, back-pay liability, and credibility damage with your team.',
    nextMove:
      'Commission a pay & award spot-check on your highest-risk roles (casuals, flat-rate, annualised salary).',
    partnerAngle: 'Award mapping, better-off-overall checks, and payroll controls that stick.',
  },
  contracts: {
    categoryId: 'contracts',
    stakes: 'Contracts and position descriptions set the legal baseline for every employment relationship.',
    riskIfWeak:
      'Disputes over hours, duties, IP, restraint, and termination become harder and more expensive to resolve.',
    nextMove:
      'Audit whether every employee has a current agreement plus FWIS/CEIS, and close gaps within 30 days.',
    partnerAngle: 'Contract templates, variation letters, and documentation that actually protect you.',
  },
  recruitment: {
    categoryId: 'recruitment',
    stakes: 'Hiring quality and process fairness affect both performance and discrimination risk.',
    riskIfWeak:
      'Poor cultural/role fit, inconsistent shortlisting, and interview questions that create legal exposure.',
    nextMove:
      'Standardise interview questions against the position description and keep shortlisting notes on file.',
    partnerAngle: 'Practical recruitment process design your managers can actually follow.',
  },
  onboarding: {
    categoryId: 'onboarding',
    stakes: 'The first weeks decide safety, productivity, and whether people stay.',
    riskIfWeak:
      'New starters miss critical policies, work-rights checks, and expectations — creating early risk and churn.',
    nextMove:
      'Build a 5-day onboarding checklist covering WHS, conduct, systems, and role clarity — and assign an owner.',
    partnerAngle: 'Onboarding that is compliant, human, and repeatable as you grow.',
  },
  policies: {
    categoryId: 'policies',
    stakes: 'Policies only work if people can find them, understand them, and leaders enforce them.',
    riskIfWeak:
      'Inconsistent management decisions, weak defence in claims, and culture that drifts from what you say you stand for.',
    nextMove:
      'Confirm your handbook covers conduct, complaints, WHS, and leave — then get written acknowledgement from all staff.',
    partnerAngle: 'A living handbook, not a PDF that sits unread.',
  },
  whs: {
    categoryId: 'whs',
    stakes: 'Workers compensation, first aid, and emergency readiness are leadership accountabilities.',
    riskIfWeak:
      'Injury response failures, regulator scrutiny, and preventable harm to people you are responsible for.',
    nextMove:
      'Verify insurance is current, first-aid coverage is adequate, and evacuation procedures are practised.',
    partnerAngle: 'WHS practicality for growing workplaces — not just a policy binder.',
  },
  performance: {
    categoryId: 'performance',
    stakes: 'How you manage performance and conduct determines fairness, retention, and claim risk.',
    riskIfWeak:
      'Issues drag on, managers avoid conversations, and exits become messy unfair-dismissal territory.',
    nextMove:
      'Put a simple documented review + PIP pathway in place, and brief managers on when to escalate.',
    partnerAngle: 'Manager coaching and process that is fair, clear, and defensible.',
  },
  training: {
    categoryId: 'training',
    stakes: 'Capability and awareness campaigns reduce both skill gaps and psychosocial risk.',
    riskIfWeak:
      'Stagnant teams, weak succession, and missed signals on safety, mental health, and respectful workplaces.',
    nextMove:
      'Pick one capability priority and one awareness campaign this quarter — then measure completion.',
    partnerAngle: 'Targeted training that supports compliance and culture, not random courses.',
  },
  culture: {
    categoryId: 'culture',
    stakes: 'Engagement, recognition, and competitive pay shape whether good people stay.',
    riskIfWeak:
      'Quiet quitting, rising turnover costs, and a workplace that feels transactional instead of purposeful.',
    nextMove:
      'Review turnover reasons for the last 12 months and set one retention action you can fund this quarter.',
    partnerAngle: 'Culture work that connects wellbeing, leadership, and commercial outcomes.',
  },
  records: {
    categoryId: 'records',
    stakes: 'Complete records are your evidence trail for pay, leave, variations, and claims.',
    riskIfWeak:
      'You cannot prove compliance when challenged — and resolving disputes takes longer and costs more.',
    nextMove:
      'Confirm employee files hold contracts, leave, variations, and licences — and that records are retained for 7 years.',
    partnerAngle: 'Record-keeping systems that survive audits and investigations.',
  },
  exits: {
    categoryId: 'exits',
    stakes: 'Terminations, redundancy, and consultation are high-stakes moments for risk and reputation.',
    riskIfWeak:
      'Unfair dismissal / adverse action claims, messy handovers, and avoidable Fair Work exposure.',
    nextMove:
      'Document your exit checklist (notice, final pay, property, consultation) and rehearse it with leadership.',
    partnerAngle: 'Safe exits — when ending employment is necessary, do it properly.',
  },
  psychosocial: {
    categoryId: 'psychosocial',
    stakes: 'Positive duty, sexual harassment response, FDV leave, and mental health are now front-line leadership risks.',
    riskIfWeak:
      'Regulatory scrutiny, serious claims, and a culture where people do not feel safe to speak up.',
    nextMove:
      'Confirm you have a clear sexual harassment response pathway, EAP access, and trained managers for first response.',
    partnerAngle: 'Psychosocial risk and positive duty — practical compliance with a people-first lens.',
  },
  ai: {
    categoryId: 'ai',
    stakes:
      'AI is changing how hiring, admin and people decisions get done — quiet use without clear ownership creates both risk and wasted effort.',
    riskIfWeak:
      'Privacy leaks, unexplained people decisions, blurred human accountability, and tools that run ahead of how the work is actually designed.',
    nextMove:
      'Name who owns AI-at-work decisions, write where humans must stay in the loop, and pick one low-risk use case with a quality check.',
    partnerAngle:
      'Practical Human–AI guardrails for people work — clarity on judgment, ownership and privacy without needing an enterprise AI program.',
  },
}

export function riskLevelForScore(score: number): RiskLevel {
  if (score < 40) return 'high'
  if (score < 60) return 'moderate'
  if (score < 80) return 'watch'
  return 'strong'
}

export function riskLabel(level: RiskLevel): string {
  switch (level) {
    case 'high':
      return 'High exposure'
    case 'moderate':
      return 'Needs action'
    case 'watch':
      return 'Watch closely'
    case 'strong':
      return 'In good shape'
  }
}

export interface LeaderAction {
  categoryId: string
  categoryName: string
  score: number
  risk: RiskLevel
  riskLabel: string
  stakes: string
  riskIfWeak: string
  nextMove: string
  partnerAngle: string
  accent: string
}

export function buildLeaderActions(
  priorities: { categoryId: string; name: string; score: number; accent: string }[],
): LeaderAction[] {
  return priorities.map((p) => {
    const g = categoryGuidance[p.categoryId]
    const risk = riskLevelForScore(p.score)
    return {
      categoryId: p.categoryId,
      categoryName: p.name,
      score: p.score,
      risk,
      riskLabel: riskLabel(risk),
      stakes: g?.stakes ?? '',
      riskIfWeak: g?.riskIfWeak ?? '',
      nextMove: g?.nextMove ?? 'Book a review with DreamStoneHR to prioritise next steps.',
      partnerAngle: g?.partnerAngle ?? '',
      accent: p.accent,
    }
  })
}

export function overallNarrative(overall: number, topRiskName?: string): { headline: string; body: string } {
  if (overall < 40) {
    return {
      headline: 'Significant HR exposure',
      body: topRiskName
        ? `Your foundations need urgent attention — especially ${topRiskName}. Treat this as a leadership priority, not an admin tidy-up.`
        : 'Your foundations need urgent attention. Treat this as a leadership priority, not an admin tidy-up.',
    }
  }
  if (overall < 60) {
    return {
      headline: 'Gaps that will cost you if ignored',
      body: topRiskName
        ? `You have workable pieces in place, but ${topRiskName} and related gaps create avoidable risk. Close the highest exposures first.`
        : 'You have workable pieces in place, but key gaps create avoidable risk. Close the highest exposures first.',
    }
  }
  if (overall < 80) {
    return {
      headline: 'Solid base — sharpen the weak spots',
      body: topRiskName
        ? `You’re not starting from zero. Focus the next 30–60 days on ${topRiskName} and the other priority areas below.`
        : 'You’re not starting from zero. Focus the next 30–60 days on the priority areas below.',
    }
  }
  return {
    headline: 'Strong foundations — keep them sharp',
    body: 'Your self-assessment suggests healthy practices. Use DreamStoneHR to stress-test the edges and stay ahead of legislative change.',
  }
}
