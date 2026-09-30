import { useState } from "react"
import { AWARD_SITUATIONS, HEADCOUNTS, STATES, type AwardId, type HeadcountId, type Profile, type StateId } from "../content"

type Props = {
  initial: Profile | null
  onBack: () => void
  onContinue: (profile: Profile) => void
}

export function ContextStep({ initial, onBack, onContinue }: Props) {
  const [businessName, setBusinessName] = useState(initial?.businessName ?? "")
  const [state, setState] = useState<StateId | "">(initial?.state ?? "")
  const [headcount, setHeadcount] = useState<HeadcountId | "">(initial?.headcount ?? "")
  const [award, setAward] = useState<AwardId | "">(initial?.award ?? "")
  const [error, setError] = useState("")

  function submit() {
    if (!state || !headcount || !award) {
      setError("Choose a state, a team size and an award situation so the report can be specific.")
      return
    }
    onContinue({ businessName, state, headcount, award })
  }

  return (
    <section className="panel">
      <header>
        <p className="eyebrow">
          <i />
          Before the questions
        </p>
        <h1>So the report fits this business.</h1>
        <p className="lede">
          Three facts change the advice: where you employ people, how many, and whether an award or
          agreement is in the picture. The business name is only for the heading of your report.
        </p>
      </header>
      <div className="fields">
        <label className="field">
          <span>
            Business name <span className="hint">optional</span>
          </span>
          <input
            value={businessName}
            onChange={(event) => setBusinessName(event.target.value)}
            autoComplete="organization"
            placeholder="As you want it on the report"
          />
        </label>
        <label className="field">
          <span>Where do you mainly employ people?</span>
          <select value={state} onChange={(event) => setState(event.target.value as StateId)}>
            <option value="">Choose a state or territory</option>
            {STATES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <div>
          <p style={{ fontWeight: 560, marginBottom: 8 }}>How many employees?</p>
          <div className="options" role="radiogroup" aria-label="How many employees?">
            {HEADCOUNTS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="option"
                role="radio"
                aria-checked={headcount === item.id}
                onClick={() => setHeadcount(item.id)}
              >
                {item.label}
                <small>{item.detail}</small>
              </button>
            ))}
          </div>
        </div>
        <div>
          <p style={{ fontWeight: 560, marginBottom: 8 }}>What covers pay and conditions?</p>
          <div className="options" role="radiogroup" aria-label="Award coverage">
            {AWARD_SITUATIONS.map((item) => (
              <button
                key={item.id}
                type="button"
                className="option"
                role="radio"
                aria-checked={award === item.id}
                onClick={() => setAward(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="nav">
        <button className="btn ghost" type="button" onClick={onBack}>
          Back
        </button>
        <button className="btn" type="button" onClick={submit}>
          Continue
        </button>
      </div>
    </section>
  )
}
