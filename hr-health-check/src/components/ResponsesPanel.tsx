import { useCallback, useEffect, useMemo, useState } from 'react'
import { useContent } from '../content/ContentProvider'
import { answerLabel } from '../data/scoring'
import {
  deleteSubmission,
  downloadBlob,
  exportSubmissionsCsv,
  listSubmissions,
} from '../responses/store'
import { downloadPdfReport } from '../responses/buildPdf'
import type { ClientSubmission } from '../responses/types'

export function ResponsesPanel({ onStatus }: { onStatus: (msg: string) => void }) {
  const { content } = useContent()
  const [submissions, setSubmissions] = useState<ClientSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const list = await listSubmissions()
      setSubmissions(list)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return submissions
    return submissions.filter((s) => {
      const hay = [
        s.contact.firstName,
        s.contact.lastName,
        s.contact.email,
        s.contact.company,
        s.contact.phone,
        s.snapshot.bandLabel,
      ]
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [query, submissions])

  const selected = submissions.find((s) => s.id === selectedId) ?? null

  const downloadReport = (s: ClientSubmission) => {
    downloadPdfReport({
      kind: 'full',
      contact: s.contact,
      answers: s.answers,
      content,
      completedAt: s.createdAt,
    })
    onStatus(`PDF report downloaded for ${s.contact.company || s.contact.email}.`)
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__row">
        <div>
          <h2>Client responses ({submissions.length})</h2>
          <p className="admin-muted">
            Every completed Health Check lands here with contact details, scores, and a downloadable report.
          </p>
        </div>
        <div className="admin-inline">
          <button type="button" className="btn btn--ghost" onClick={() => void refresh()}>
            Refresh
          </button>
          <button
            type="button"
            className="btn btn--teal"
            disabled={!submissions.length}
            onClick={() => {
              downloadBlob(
                `dreamstone-hr-responses-${new Date().toISOString().slice(0, 10)}.csv`,
                exportSubmissionsCsv(submissions),
                'text/csv;charset=utf-8',
              )
              onStatus('CSV exported.')
            }}
          >
            Export CSV
          </button>
        </div>
      </div>

      <label className="field">
        <span>Search clients</span>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Name, email, company…"
        />
      </label>

      {loading ? (
        <p className="admin-muted">Loading responses…</p>
      ) : filtered.length === 0 ? (
        <div className="responses-empty">
          <h3>No responses yet</h3>
          <p>
            Complete a Health Check on the live tool (or have a client complete one). Submissions appear here
            automatically so you can review details and download their report.
          </p>
        </div>
      ) : (
        <div className="admin-split responses-split">
          <ul className="admin-list responses-list">
            {filtered.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  className={selectedId === s.id ? 'is-active' : ''}
                  onClick={() => setSelectedId(s.id)}
                >
                  <strong>
                    {s.contact.firstName} {s.contact.lastName}
                  </strong>
                  <span>{s.contact.company || s.contact.email}</span>
                  <em>
                    {s.snapshot.overall}% · {new Date(s.createdAt).toLocaleDateString()}
                  </em>
                </button>
              </li>
            ))}
          </ul>

          {selected ? (
            <div className="admin-editor response-detail">
              <div className="admin-panel__row">
                <h3>
                  {selected.contact.firstName} {selected.contact.lastName}
                </h3>
                <div className="admin-inline">
                  <button
                    type="button"
                    className="btn btn--lime"
                    onClick={() => downloadReport(selected)}
                  >
                    Download PDF report
                  </button>
                  <button
                    type="button"
                    className="btn btn--teal"
                    onClick={() => {
                      downloadPdfReport({
                        kind: 'actions',
                        contact: selected.contact,
                        answers: selected.answers,
                        content,
                        completedAt: selected.createdAt,
                      })
                    }}
                  >
                    Action plan PDF
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => {
                      if (
                        confirm(
                          `Delete response for ${selected.contact.firstName} ${selected.contact.lastName}?`,
                        )
                      ) {
                        void deleteSubmission(selected.id).then(() => {
                          setSelectedId(null)
                          void refresh()
                          onStatus('Response deleted.')
                        })
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>

              <dl className="response-meta">
                <div>
                  <dt>Company</dt>
                  <dd>{selected.contact.company || '—'}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>
                    <a href={`mailto:${selected.contact.email}`}>{selected.contact.email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Phone</dt>
                  <dd>
                    {selected.contact.phone ? (
                      <a href={`tel:${selected.contact.phone}`}>{selected.contact.phone}</a>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Completed</dt>
                  <dd>{new Date(selected.createdAt).toLocaleString()}</dd>
                </div>
                <div>
                  <dt>Overall</dt>
                  <dd>
                    <strong>{selected.snapshot.overall}%</strong> · {selected.snapshot.bandLabel}
                  </dd>
                </div>
                <div>
                  <dt>Reference</dt>
                  <dd>
                    <code>{selected.id}</code>
                  </dd>
                </div>
              </dl>

              <h4>Priority areas</h4>
              <ul className="response-priorities">
                {selected.snapshot.priorities.map((p) => (
                  <li key={p.categoryId}>
                    <strong>{p.name}</strong>
                    <span>{p.score}%</span>
                  </li>
                ))}
              </ul>

              <h4>Full scorecard</h4>
              <ul className="response-scorecard">
                {selected.snapshot.categories.map((c) => (
                  <li key={c.categoryId}>
                    <span>{c.name}</span>
                    <strong>{c.score}%</strong>
                  </li>
                ))}
              </ul>

              <h4>Answers</h4>
              <div className="response-answers">
                {content.questions.map((q) => (
                  <div key={q.id} className="response-answers__item">
                    <strong>{q.prompt}</strong>
                    <p>{answerLabel(q, selected.answers[q.id] ?? null)}</p>
                  </div>
                ))}
                {selected.answers.feedback != null && String(selected.answers.feedback).trim() && (
                  <div className="response-answers__item">
                    <strong>{content.feedbackPrompt}</strong>
                    <p>{String(selected.answers.feedback)}</p>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="btn btn--lime"
                onClick={() => {
                  downloadPdfReport({
                    kind: 'full',
                    contact: selected.contact,
                    answers: selected.answers,
                    content,
                    completedAt: selected.createdAt,
                  })
                }}
              >
                Download PDF report
              </button>
              <button
                type="button"
                className="btn btn--teal"
                onClick={() => {
                  downloadPdfReport({
                    kind: 'actions',
                    contact: selected.contact,
                    answers: selected.answers,
                    content,
                    completedAt: selected.createdAt,
                  })
                }}
              >
                Action plan PDF
              </button>
            </div>
          ) : (
            <p className="admin-muted">Select a client response to view details and download their report.</p>
          )}
        </div>
      )}
    </section>
  )
}
