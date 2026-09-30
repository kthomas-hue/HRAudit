import { useMemo } from 'react'
import { categories, questions, feedbackQuestion } from '../data/questions'
import { answerLabel, bandForScore, computeResults, type Answers } from '../data/scoring'
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

  return (
    <section className="results">
      <div className="results__hero">
        <Logo inverted className="results__logo" />
        <p className="eyebrow eyebrow--light">Your results are in</p>
        <h1>
          Thanks, <span className="highlight-lime">{contact.firstName || 'there'}</span>
        </h1>
        <p className="lead lead--light">
          Here’s a clear snapshot of {contact.company || 'your'} HR foundations. Use it to prioritise where
          DreamStoneHR can help you move from risk to best practice.
        </p>
        <div className={`overall-score tone-${band.tone}`}>
          <div className="overall-score__ring" style={{ ['--score' as string]: results.overall }}>
            <strong>{results.overall}%</strong>
            <span>Overall</span>
          </div>
          <div className="overall-score__copy">
            <h2>{band.label}</h2>
            <p>
              Scores reflect your self-assessment across {categories.length} HR areas. Lower scores are
              opportunities — not judgments. We’re here to help you close the gaps.
            </p>
          </div>
        </div>
      </div>

      <div className="results__body">
        <div className="results__grid">
          <div className="results__panel">
            <h3>Scorecard</h3>
            <ul className="score-list">
              {results.categories.map((c) => (
                <li key={c.categoryId}>
                  <div className="score-list__row">
                    <span>{c.name}</span>
                    <strong>{c.score}%</strong>
                  </div>
                  <div className="score-list__bar">
                    <span style={{ width: `${c.score}%`, background: c.accent }} />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <aside className="results__aside">
            <div className="insight-card">
              <h3>Priorities to tackle first</h3>
              {results.priorities.map((c) => (
                <div key={c.categoryId} className="insight-card__item">
                  <span className="insight-card__score" style={{ color: c.accent }}>
                    {c.score}%
                  </span>
                  <div>
                    <strong>{c.name}</strong>
                    <p>Worth a closer look with your HR partner.</p>
                  </div>
                </div>
              ))}
            </div>
            {results.strengths.length > 0 && (
              <div className="insight-card insight-card--strength">
                <h3>What’s working</h3>
                {results.strengths.map((c) => (
                  <div key={c.categoryId} className="insight-card__item">
                    <span className="insight-card__score" style={{ color: c.accent }}>
                      {c.score}%
                    </span>
                    <div>
                      <strong>{c.name}</strong>
                      <p>Keep reinforcing these practices.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
        </div>

        <div className="cta-banner">
          <div>
            <h2>Let’s turn insight into action</h2>
            <p>
              If you’d like to discuss this Health Check — compliance, best practice, or a full HR partnership —
              reach out. We’re ready when you are.
            </p>
          </div>
          <div className="cta-banner__actions">
            <a className="btn btn--lime" href="mailto:info@dreamstonehr.com.au?subject=HR%20Health%20Check%20results">
              Email the team
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
