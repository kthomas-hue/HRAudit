import { useMemo } from 'react'
import { questions, feedbackQuestion } from '../data/questions'
import { answerLabel, bandForScore, computeResults, type Answers } from '../data/scoring'
import {
  buildLeaderActions,
  categoryGuidance,
  overallNarrative,
  riskLabel,
  riskLevelForScore,
} from '../data/guidance'
import type { ContactInfo } from '../hooks/useAssessmentState'
import { Logo } from './Logo'

interface ResultsProps {
  contact: ContactInfo
  answers: Answers
  onRestart: () => void
}

export function Results({ contact, answers, onRestart }: ResultsProps) {
  const results = useMemo(() => computeResults(answers), [answers])
  const band = bandForScore(results.overall)
  const actions = useMemo(() => buildLeaderActions(results.priorities), [results.priorities])
  const topRisk = results.priorities[0]?.name
  const narrative = overallNarrative(results.overall, topRisk)

  const mailto = useMemo(() => {
    const lines = [
      `Hi DreamStoneHR,`,
      ``,
      `I've completed the HR Health Check for ${contact.company || 'our business'}.`,
      `Overall score: ${results.overall}% (${narrative.headline}).`,
      ``,
      `Priority areas:`,
      ...actions.map((a) => `- ${a.categoryName}: ${a.score}% — ${a.nextMove}`),
      ``,
      `I'd like to discuss next steps.`,
      ``,
      `${contact.firstName} ${contact.lastName}`.trim(),
      contact.email,
      contact.phone,
    ]
    return `mailto:info@dreamstonehr.com.au?subject=${encodeURIComponent(
      `HR Health Check — ${contact.company || contact.firstName || 'results'}`,
    )}&body=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
  }, [actions, contact, narrative.headline, results.overall])

  return (
    <section className="results">
      <div className="results__hero">
        <div className="results__hero-wash" aria-hidden />
        <Logo inverted className="results__logo" />
        <p className="eyebrow eyebrow--light">Your leadership brief</p>
        <h1>
          {contact.firstName ? `${contact.firstName}, here’s the picture` : 'Here’s the picture'}
        </h1>
        <p className="lead lead--light">
          A clear read on {contact.company || 'your'} HR foundations — the exposures that matter, and the next
          moves worth making.
        </p>

        <div className={`overall-score tone-${band.tone}`}>
          <div className="overall-score__ring" style={{ ['--score' as string]: results.overall }}>
            <strong>{results.overall}%</strong>
            <span>Overall</span>
          </div>
          <div className="overall-score__copy">
            <p className="overall-score__kicker">{band.label}</p>
            <h2>{narrative.headline}</h2>
            <p>{narrative.body}</p>
          </div>
        </div>
      </div>

      <div className="results__body">
        <section className="brief-block">
          <div className="brief-block__head">
            <h3>Your top 3 moves</h3>
            <p>Start here. These are the areas most likely to create risk or drag performance.</p>
          </div>
          <div className="action-grid">
            {actions.map((a, i) => (
              <article key={a.categoryId} className={`action-card risk-${a.risk}`}>
                <header>
                  <span className="action-card__rank">0{i + 1}</span>
                  <span className={`risk-pill risk-pill--${a.risk}`}>{a.riskLabel}</span>
                </header>
                <h4>{a.categoryName}</h4>
                <p className="action-card__score" style={{ color: a.accent }}>
                  {a.score}%
                </p>
                <p className="action-card__risk">
                  <strong>If left alone:</strong> {a.riskIfWeak}
                </p>
                <p className="action-card__move">
                  <strong>Do next:</strong> {a.nextMove}
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="results__grid">
          <div className="results__panel">
            <h3>Full scorecard</h3>
            <ul className="score-list">
              {results.categories.map((c) => {
                const risk = riskLevelForScore(c.score)
                return (
                  <li key={c.categoryId}>
                    <div className="score-list__row">
                      <span>
                        {c.name}
                        <em className={`risk-inline risk-inline--${risk}`}>{riskLabel(risk)}</em>
                      </span>
                      <strong>{c.score}%</strong>
                    </div>
                    <div className="score-list__bar">
                      <span style={{ width: `${c.score}%`, background: c.accent }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>

          <aside className="results__aside">
            {results.strengths.length > 0 && (
              <div className="insight-card insight-card--strength">
                <h3>Protect what’s working</h3>
                {results.strengths.map((c) => (
                  <div key={c.categoryId} className="insight-card__item">
                    <span className="insight-card__score" style={{ color: c.accent }}>
                      {c.score}%
                    </span>
                    <div>
                      <strong>{c.name}</strong>
                      <p>{categoryGuidance[c.categoryId]?.stakes ?? 'Keep reinforcing these practices.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="insight-card">
              <h3>How to use this brief</h3>
              <ol className="brief-steps">
                <li>Share the top 3 moves with your leadership team this week.</li>
                <li>Assign an owner and a 30-day checkpoint for each move.</li>
                <li>Bring DreamStoneHR in where exposure or capacity is the blocker.</li>
              </ol>
            </div>
          </aside>
        </div>

        <div className="cta-banner">
          <div>
            <h2>Ready to close the gaps?</h2>
            <p>
              We’ll help you turn this brief into a practical plan — compliance, capability, and culture —
              without the fluff.
            </p>
          </div>
          <div className="cta-banner__actions">
            <a className="btn btn--lime" href={mailto}>
              Email this brief to DreamStoneHR
              <span className="btn__arrow" aria-hidden>
                ↗
              </span>
            </a>
            <a className="btn btn--teal" href="tel:+61283209320">
              Call (02) 8320 9320
            </a>
          </div>
        </div>

        <details className="responses">
          <summary>Questions and responses</summary>
          <div className="responses__list">
            {questions.map((q) => (
              <div key={q.id} className="responses__item">
                <h4>{q.prompt}</h4>
                <p>
                  <strong>Your response:</strong> {answerLabel(q, answers[q.id] ?? null)}
                </p>
              </div>
            ))}
            {answers[feedbackQuestion.id] && (
              <div className="responses__item">
                <h4>{feedbackQuestion.prompt}</h4>
                <p>
                  <strong>Your response:</strong> {String(answers[feedbackQuestion.id])}
                </p>
              </div>
            )}
          </div>
        </details>

        <div className="results__footer-actions">
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            Take the check again
          </button>
          <a className="text-link" href="https://www.dreamstonehr.com.au" target="_blank" rel="noreferrer">
            Visit dreamstonehr.com.au →
          </a>
        </div>
      </div>
    </section>
  )
}
