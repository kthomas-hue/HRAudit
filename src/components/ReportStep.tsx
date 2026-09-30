import { useState, type FormEvent } from "react"
import type { Profile } from "../content"
import type { Answers } from "../model"
import { bandLabel } from "../model"
import { buildReport } from "../report"

type Props = {
  profile: Profile
  answers: Answers
  example?: boolean
  onEdit: () => void
  onRestart: () => void
}

export function ReportStep({ profile, answers, example = false, onEdit, onRestart }: Props) {
  const report = buildReport(profile, answers)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [message, setMessage] = useState("")

  async function save(event: FormEvent) {
    event.preventDefault()
    if (status === "saving" || status === "saved") return
    setStatus("saving")
    setMessage("")
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          businessName: report.businessName,
          state: profile.state,
          headcount: profile.headcount,
          award: profile.award,
          overall: report.overall,
          sections: report.sections.map((item) => ({
            id: item.score.section.id,
            title: item.score.section.title,
            percent: item.score.percent,
            band: item.score.band,
          })),
          priorities: report.priorities.map((item) => ({
            section: item.sectionTitle,
            prompt: item.prompt,
          })),
        }),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) {
        setStatus("error")
        setMessage(body.error ?? "We could not save that. Your report is still on this page.")
        return
      }
      setStatus("saved")
    } catch {
      setStatus("error")
      setMessage("We could not save that. Print or save as PDF — the report is already here.")
    }
  }

  return (
    <article className="report">
      <div className="print-only">
        <p className="eyebrow">
          <i />
          DreamStoneHR
        </p>
      </div>
      <header className="report-hero">
        <div>
          <p className="eyebrow">
            <i />
            HR health check · {report.dateLabel}
          </p>
          <h1>{report.businessName}</h1>
          <p className="lede">{report.headline}</p>
          {example && (
            <p className="example-banner">
              Example only. These answers belong to a fictional Victorian workshop, not your business.
            </p>
          )}
        </div>
        <div className={`score-pill band-${report.band}`}>
          <strong>{report.overall === null ? "—" : report.overall}</strong>
          <span>{report.bandLabel}</span>
        </div>
      </header>

      <section className="card">
        <h2>How to read this</h2>
        <p>{report.lede}</p>
        <p>
          Each area below is written for the band your answers landed in. 70 or above is in good
          shape, 50 to 69 is partly in place, and under 50 needs attention. The number is not a
          mark, a compliance finding, or legal advice. “Not sure” counts as a gap. Questions that
          do not apply are left out of the score.
        </p>
      </section>

      <section className="card">
        <h2>{report.priorities.length ? "Start with these" : "Nothing urgent stood out"}</h2>
        {report.priorities.length === 0 ? (
          <p>
            On your answers, no section fell into a clear gap. Keep the habits described below, and
            revisit this if you hire, change hours, or take on a new award.
          </p>
        ) : (
          report.priorities.map((item, index) => (
            <div className="priority" key={item.questionId}>
              <p className="kicker">
                {index + 1} · {item.sectionTitle}
                {item.unsure ? " · you were not sure" : ""}
              </p>
              <h3>{item.prompt}</h3>
              <p className="action">{item.action}</p>
            </div>
          ))
        )}
      </section>

      {report.sections.map((item) => (
        <section className="card" key={item.score.section.id}>
          <div className="section-head">
            <h2>{item.score.section.title}</h2>
            <strong className={`band-${item.score.band}`}>
              {item.score.percent === null ? "—" : `${item.score.percent}`} · {bandLabel(item.score.band)}
            </strong>
          </div>
          {item.score.percent !== null && (
            <div className={`meter ${item.score.band}`} aria-hidden="true">
              <span style={{ width: `${item.score.percent}%` }} />
            </div>
          )}
          <p>{item.reading}</p>
          {item.actions.length > 0 && (
            <>
              <h3>What to do</h3>
              {item.actions.map((action) => (
                <p className="action" key={action.text}>
                  {action.unsure ? "You were not sure, so start here. " : ""}
                  {action.text}
                </p>
              ))}
            </>
          )}
          {item.impact && (
            <>
              <h3>What changes</h3>
              <p>{item.impact}</p>
            </>
          )}
          {item.resources.length > 0 && (
            <>
              <h3>Where to look</h3>
              <ul className="resources">
                {item.resources.map((link) => (
                  <li key={link.href}>
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.title}
                    </a>
                    <span>{link.source}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      ))}

      <section className="card">
        <h2>Notes for your state and size</h2>
        <ul className="notes">
          {report.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>What this review did not do</h2>
        <p>
          It did not read a contract, interpret an award clause against a roster, or check a pay run.
          That is the difference between a screen like this and a full audit of the documents. The
          actions above are the part you can do before anyone else opens the file.
        </p>
        <p>
          Workplace laws change, and some rules depend on the award, the state and the facts. If a
          decision is expensive — a dismissal, a back-pay question, a serious complaint — check it
          against the source, or have the documents reviewed, before you act.
        </p>
        <p className="sources">
          <a href="https://www.fairwork.gov.au/" target="_blank" rel="noreferrer">
            Fair Work Ombudsman
          </a>
          <a href="https://www.ato.gov.au/paydaysuper" target="_blank" rel="noreferrer">
            ATO Payday Super
          </a>
          <a href="https://www.safeworkaustralia.gov.au/safety-topic/managing-health-and-safety/mental-health" target="_blank" rel="noreferrer">
            Safe Work Australia, psychological health
          </a>
        </p>
      </section>

      <section className="card keep no-print">
        <div>
          <h2>Keep this report</h2>
          <p>
            Print it, or save it as a PDF, and share it with the person who runs payroll. That does
            not require your email.
          </p>
          {!example && (
            <p>
              If you would like DreamStoneHR to hold this summary so a copy can be sent to you, leave
              your details. They are used for this review only — not a newsletter.
            </p>
          )}
          <div className="actions">
            <button className="btn" type="button" onClick={() => window.print()}>
              Print or save as PDF
            </button>
            {example ? (
              <button className="btn secondary" type="button" onClick={onRestart}>
                Start with your business
              </button>
            ) : (
              <>
                <button className="btn secondary" type="button" onClick={onEdit}>
                  Edit answers
                </button>
                <button className="btn ghost" type="button" onClick={onRestart}>
                  Start again
                </button>
              </>
            )}
          </div>
        </div>
        {example ? (
          <p>
            When you do your own review, you can leave your details here if you want a copy kept on
            file. You never have to. Printing is enough.
          </p>
        ) : (
        <form onSubmit={save}>
          <label className="field">
            <span>Your name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
          </label>
          <label className="field">
            <span>Work email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>
              Mobile <span className="hint">optional</span>
            </span>
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} autoComplete="tel" />
          </label>
          {status === "saved" ? (
            <p className="success" role="status">
              Saved with this review. You can still print the report on this page.
            </p>
          ) : (
            <button className="btn secondary" type="submit" disabled={status === "saving"}>
              {status === "saving" ? "Saving…" : "Keep my details with this report"}
            </button>
          )}
          {status === "error" && (
            <p className="error" role="alert">
              {message}
            </p>
          )}
        </form>
        )}
      </section>
    </article>
  )
}
