type Props = {
  canResume: boolean
  onStart: () => void
  onResume: () => void
  onExample: () => void
}

export function Welcome({ canResume, onStart, onResume, onExample }: Props) {
  return (
    <section className="welcome">
      <div>
        <p className="eyebrow">
          <i />
          HR health check
        </p>
        <h1>A straight look at your HR foundations.</h1>
        <p className="lede">
          Ten minutes on how your business employs, pays and looks after people. You leave with a
          report that ranks the risks and gives you actions to start on — written for an owner, not
          a courtroom.
        </p>
        <ul className="promise">
          <li>Eight areas of Australian workplace practice, from contracts and awards to safety and records.</li>
          <li>A clear order of what to fix yourself this month.</li>
          <li>Notes for your state and the size of your team, so the advice is not generic.</li>
        </ul>
        <div className="actions">
          <button className="btn" type="button" onClick={canResume ? onResume : onStart}>
            {canResume ? "Continue your review" : "Start the review"}
          </button>
          {canResume && (
            <button className="btn secondary" type="button" onClick={onStart}>
              Start again
            </button>
          )}
          {!canResume && (
            <button className="btn secondary" type="button" onClick={onExample}>
              See an example report
            </button>
          )}
        </div>
        <p className="fine">
          About 10 minutes. Answers stay in this browser until you finish. General information, not
          legal advice.
        </p>
      </div>
      <aside className="sample">
        <p className="sample-kicker">What you leave with</p>
        <h2>A report you can use on Monday.</h2>
        <ol>
          <li>
            <span>Award coverage</span>
            <em className="tag exposed">Start here</em>
          </li>
          <li>
            <span>Payroll compliance</span>
            <em className="tag uneven">Needs a look</em>
          </li>
          <li>
            <span>Employment contracts</span>
            <em className="tag holding">In place, with gaps</em>
          </li>
          <li>
            <span>Safety and psychological safety</span>
            <em className="tag sound">Sound on this screen</em>
          </li>
        </ol>
        <p>An example layout, not a result. Yours is built only from your answers.</p>
      </aside>
    </section>
  )
}
