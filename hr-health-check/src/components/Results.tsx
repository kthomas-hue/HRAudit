import { useEffect, useMemo, useRef, useState } from 'react'
import { useContent } from '../content/ContentProvider'
import type { ActionItem, CategoryGuidance, ResourceLink } from '../content/types'
import {
  answerLabel,
  bandForScore,
  computeResults,
  overallNarrative,
  riskLabel,
  riskLevelForScore,
  type Answers,
  type CategoryScore,
  type RiskLevel,
} from '../data/scoring'
import type { ContactInfo } from '../hooks/useAssessmentState'
import { buildReportHtml, reportFilename } from '../responses/buildReportHtml'
import { downloadPdfReport } from '../responses/buildPdf'
import { downloadBlob, saveSubmission } from '../responses/store'
import { RESPONSE_SAVED_FLAG_KEY, snapshotFromResults, type ClientSubmission } from '../responses/types'
import { Logo } from './Logo'

interface ResultsProps {
  contact: ContactInfo
  answers: Answers
  completedAt?: string
  onRestart: () => void
}

interface LeaderAction {
  categoryId: string
  categoryName: string
  score: number
  accent: string
  risk: RiskLevel
  riskLabel: string
  riskIfWeak: string
  nextMove: string
  partnerAngle: string
  reportDetail: string
  actions: ActionItem[]
  resources: ResourceLink[]
}

function emptyGuidance(categoryId: string): CategoryGuidance {
  return {
    categoryId,
    stakes: 'Keep reinforcing practices in this area.',
    riskIfWeak: 'Gaps here create avoidable people and compliance risk.',
    nextMove: 'Review current practice with your leadership team and assign an owner.',
    partnerAngle: 'DreamStoneHR can help you design a practical plan for this area.',
    reportDetail: '',
    actions: [],
    resources: [],
  }
}

function buildLeaderActions(
  priorities: CategoryScore[],
  guidance: Record<string, CategoryGuidance>,
): LeaderAction[] {
  return priorities.map((c) => {
    const g = guidance[c.categoryId] ?? emptyGuidance(c.categoryId)
    const risk = riskLevelForScore(c.score)
    return {
      categoryId: c.categoryId,
      categoryName: c.name,
      score: c.score,
      accent: c.accent,
      risk,
      riskLabel: riskLabel(risk),
      riskIfWeak: g.riskIfWeak,
      nextMove: g.nextMove,
      partnerAngle: g.partnerAngle,
      reportDetail: g.reportDetail,
      actions: g.actions,
      resources: g.resources,
    }
  })
}

function phoneToTel(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.startsWith('+') ? digits : digits.replace(/^0/, '+61')
}

function makeSubmissionId(contact: ContactInfo, completedAt: string) {
  const base = `${contact.email}|${completedAt}|${contact.company}`.toLowerCase()
  let hash = 0
  for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0
  return `sub-${hash.toString(36)}`
}

export function Results({ contact, answers, completedAt, onRestart }: ResultsProps) {
  const { content } = useContent()
  const { settings, categories, questions, guidance } = content
  const [savedId, setSavedId] = useState<string | null>(null)
  const saveAttempted = useRef(false)

  const results = useMemo(
    () => computeResults(answers, categories, questions),
    [answers, categories, questions],
  )
  const band = bandForScore(results.overall)
  const actions = useMemo(
    () => buildLeaderActions(results.priorities, guidance),
    [results.priorities, guidance],
  )
  const topRisk = results.priorities[0]?.name
  const narrative = overallNarrative(results.overall, topRisk)
  const finishedAt = completedAt || new Date().toISOString()

  const allCategoryBriefs = useMemo(
    () =>
      [...results.categories]
        .sort((a, b) => a.score - b.score)
        .map((c) => {
          const g = guidance[c.categoryId] ?? emptyGuidance(c.categoryId)
          const risk = riskLevelForScore(c.score)
          return { ...c, guidance: g, risk, riskLabel: riskLabel(risk) }
        }),
    [results.categories, guidance],
  )

  useEffect(() => {
    if (saveAttempted.current) return
    if (!contact.email) return
    saveAttempted.current = true
    const id = makeSubmissionId(contact, finishedAt)
    const already = sessionStorage.getItem(RESPONSE_SAVED_FLAG_KEY)
    if (already === id) {
      setSavedId(id)
      return
    }
    const submission: ClientSubmission = {
      id,
      createdAt: finishedAt,
      contact,
      answers,
      snapshot: snapshotFromResults(results, band.label),
      contentUpdatedAt: content.updatedAt,
    }
    void saveSubmission(submission).then(() => {
      sessionStorage.setItem(RESPONSE_SAVED_FLAG_KEY, id)
      setSavedId(id)
    })
  }, [answers, band.label, contact, content.updatedAt, finishedAt, results])

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
    return `mailto:${settings.contactEmail}?subject=${encodeURIComponent(
      `HR Health Check — ${contact.company || contact.firstName || 'results'}`,
    )}&body=${encodeURIComponent(lines.filter(Boolean).join('\n'))}`
  }, [actions, contact, narrative.headline, results.overall, settings.contactEmail])

  const timeframeOrder = { 'This week': 0, '30 days': 1, '90 days': 2 } as const

  const downloadReport = () => {
    downloadPdfReport({
      kind: 'full',
      contact,
      answers,
      content,
      completedAt: finishedAt,
    })
  }

  const downloadActions = () => {
    downloadPdfReport({
      kind: 'actions',
      contact,
      answers,
      content,
      completedAt: finishedAt,
    })
  }

  const downloadHtmlCopy = () => {
    const html = buildReportHtml({
      contact,
      answers,
      content,
      completedAt: finishedAt,
      submissionId: savedId ?? undefined,
    })
    downloadBlob(reportFilename(contact, finishedAt), html, 'text/html;charset=utf-8')
  }

  const jumpToCategory = (categoryId: string) => {
    const el = document.getElementById(`category-${categoryId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <section className="results">
      <div className="results__hero">
        <div className="results__hero-wash" aria-hidden />
        <Logo className="results__logo" size="md" />
        <p className="eyebrow eyebrow--light">{settings.reportTitle}</p>
        <h1>
          {contact.firstName ? `${contact.firstName}, here’s the picture` : 'Here’s the picture'}
        </h1>
        <p className="lead lead--light">
          Your paid leadership report for {contact.company || 'your business'} — exposures, timed actions,
          DreamStoneHR resources, and what to do next.
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

        <div className="results__hero-actions download-pack">
          <button type="button" className="btn btn--lime" onClick={downloadReport}>
            Download PDF report
            <span className="btn__arrow" aria-hidden>
              ↘
            </span>
          </button>
          <button type="button" className="btn btn--teal" onClick={downloadActions}>
            Download action plan PDF
          </button>
        </div>
      </div>

      <div className="results__body">
        <section className="brief-block brief-block--scorecard" id="scorecard">
          <div className="brief-block__head">
            <h3>Full scorecard</h3>
            <p>Your map of the whole Health Check. Click any category to jump straight to the detail, actions and resources.</p>
          </div>
          <ul className="score-list score-list--jump">
            {results.categories.map((c) => {
              const risk = riskLevelForScore(c.score)
              return (
                <li key={c.categoryId}>
                  <button
                    type="button"
                    className="score-list__jump"
                    onClick={() => jumpToCategory(c.categoryId)}
                  >
                    <div className="score-list__row">
                      <span>
                        {c.name}
                        <em className={`risk-inline risk-inline--${risk}`}>{riskLabel(risk)}</em>
                      </span>
                      <strong style={{ color: c.accent }}>{c.score}%</strong>
                    </div>
                    <div className="score-list__bar">
                      <span style={{ width: `${c.score}%`, background: c.accent }} />
                    </div>
                    <span className="score-list__hint">View detail →</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="brief-block brief-block--priorities">
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
                <h4>
                  <button type="button" className="text-link action-card__link" onClick={() => jumpToCategory(a.categoryId)}>
                    {a.categoryName}
                  </button>
                </h4>
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

        <section className="brief-block report-deep">
          <div className="brief-block__head">
            <h3>Category detail, actions &amp; resources</h3>
            <p>
              Each section includes timed actions, DreamStoneHR resources, and external guidance (Fair Work, Safe
              Work and more) — plus how we can partner with you to close the gap.
            </p>
          </div>

          <div className="report-deep__list">
            {allCategoryBriefs.map((c) => {
              const dreamstoneResources = c.guidance.resources.filter((r) => r.source === 'dreamstone')
              const externalResources = c.guidance.resources.filter((r) => r.source !== 'dreamstone')
              return (
              <article key={c.categoryId} id={`category-${c.categoryId}`} className="category-report">
                <header className="category-report__head">
                  <div>
                    <p className="category-report__meta">
                      <span className={`risk-pill risk-pill--${c.risk}`}>{c.riskLabel}</span>
                      <span className="category-report__score" style={{ color: c.accent }}>
                        {c.score}%
                      </span>
                    </p>
                    <h4>{c.name}</h4>
                  </div>
                  <p className="category-report__stakes">{c.guidance.stakes}</p>
                </header>

                {c.guidance.reportDetail && (
                  <p className="category-report__detail">{c.guidance.reportDetail}</p>
                )}

                <div className="category-report__columns">
                  <div>
                    <h5>Recommended actions</h5>
                    {c.guidance.actions.length === 0 ? (
                      <p className="category-report__empty">
                        {c.guidance.nextMove || 'Assign an owner and set a 30-day checkpoint.'}
                      </p>
                    ) : (
                      <ol className="action-timeline">
                        {[...c.guidance.actions]
                          .sort((a, b) => timeframeOrder[a.timeframe] - timeframeOrder[b.timeframe])
                          .map((item) => (
                            <li key={item.id}>
                              <span className="action-timeline__when">{item.timeframe}</span>
                              <strong>{item.title}</strong>
                              <p>{item.detail}</p>
                            </li>
                          ))}
                      </ol>
                    )}
                  </div>

                  <div>
                    <h5>Resources</h5>
                    {c.guidance.resources.length === 0 ? (
                      <p className="category-report__empty">
                        Ask DreamStoneHR for tailored templates and checklists for this area.
                      </p>
                    ) : (
                      <>
                        {dreamstoneResources.length > 0 && (
                          <div className="resource-group">
                            <p className="resource-group__label">DreamStoneHR</p>
                            <ul className="resource-list">
                              {dreamstoneResources.map((r) => (
                                <li key={r.id}>
                                  <a href={r.url} target="_blank" rel="noreferrer">
                                    {r.label}
                                    <span aria-hidden> ↗</span>
                                  </a>
                                  {r.description && <p>{r.description}</p>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {externalResources.length > 0 && (
                          <div className="resource-group">
                            <p className="resource-group__label">External</p>
                            <ul className="resource-list">
                              {externalResources.map((r) => (
                                <li key={r.id}>
                                  <a href={r.url} target="_blank" rel="noreferrer">
                                    {r.label}
                                    <span aria-hidden> ↗</span>
                                  </a>
                                  {r.description && <p>{r.description}</p>}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <aside className="category-report__help">
                  <h5>How DreamStoneHR can help here</h5>
                  <p>
                    {c.guidance.partnerAngle
                      ? `${c.guidance.partnerAngle} We’ll help you turn the actions above into a 30–90 day workplan — with templates your managers will use, and support so it doesn’t stall after the report.`
                      : 'We’ll help you turn the actions above into a 30–90 day workplan — templates, manager coaching, and compliance checks included.'}
                  </p>
                  <a className="text-link" href={mailto}>
                    Talk to us about {c.name.toLowerCase()} →
                  </a>
                </aside>
              </article>
            )})}
          </div>
        </section>

        <div className="results__grid">
          <aside className="results__aside results__aside--wide">
            {results.strengths.length > 0 && (
              <div className="insight-card insight-card--strength">
                <h3>Protect what’s working</h3>
                {results.strengths.map((c) => (
                  <div key={c.categoryId} className="insight-card__item">
                    <span className="insight-card__score" style={{ color: c.accent }}>
                      {c.score}%
                    </span>
                    <div>
                      <strong>
                        <button type="button" className="text-link" onClick={() => jumpToCategory(c.categoryId)}>
                          {c.name}
                        </button>
                      </strong>
                      <p>{guidance[c.categoryId]?.stakes ?? 'Keep reinforcing these practices.'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="insight-card">
              <h3>How to use this report</h3>
              <ol className="brief-steps">
                <li>Scan the scorecard, then click into your weakest categories.</li>
                <li>Download the PDF report for the full narrative, and the action plan PDF to assign owners and due dates.</li>
                <li>Use DreamStoneHR and external resources in each section — then bring us in where capacity or exposure is the blocker.</li>
              </ol>
              <div className="download-pack">
                <button type="button" className="btn btn--ghost" onClick={downloadHtmlCopy}>
                  Also save HTML copy
                </button>
              </div>
            </div>
          </aside>
        </div>

        <div className="cta-banner">
          <div>
            <h2>Partner with DreamStoneHR</h2>
            <p>
              This report shows where you’re exposed. We help you close it — practical systems, manager capability,
              and compliance that sticks. Book a debrief on your top 3 moves and we’ll map the first 30 days with you.
            </p>
          </div>
          <div className="cta-banner__actions">
            <button type="button" className="btn btn--ghost" onClick={downloadReport}>
              Download PDF report
            </button>
            <button type="button" className="btn btn--ghost" onClick={downloadActions}>
              Action plan PDF
            </button>
            <a className="btn btn--lime" href={mailto}>
              {settings.partnerCtaLabel}
              <span className="btn__arrow" aria-hidden>
                ↗
              </span>
            </a>
            <a className="btn btn--teal" href={`tel:${phoneToTel(settings.contactPhone)}`}>
              Call {settings.contactPhone}
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
            {answers.feedback && (
              <div className="responses__item">
                <h4>{content.feedbackPrompt}</h4>
                <p>
                  <strong>Your response:</strong> {String(answers.feedback)}
                </p>
              </div>
            )}
          </div>
        </details>

        <div className="results__footer-actions">
          <button type="button" className="btn btn--ghost" onClick={onRestart}>
            Take the check again
          </button>
          <a className="text-link" href={settings.websiteUrl} target="_blank" rel="noreferrer">
            Visit dreamstonehr.com.au →
          </a>
        </div>
      </div>
    </section>
  )
}
