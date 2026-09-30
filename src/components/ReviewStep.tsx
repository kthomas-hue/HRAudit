import { questions, sections } from "../content"
import { firstUnanswered, type Answers } from "../model"

type Props = {
  answers: Answers
  onEdit: (index: number) => void
  onBack: () => void
  onReport: () => void
}

export function ReviewStep({ answers, onEdit, onBack, onReport }: Props) {
  const missing = firstUnanswered(answers)
  return (
    <section className="panel">
      <header>
        <p className="eyebrow">
          <i />
          Check the picture
        </p>
        <h1>Change anything that does not sound like the business.</h1>
        <p className="lede">
          The report is only as honest as these answers. Open a section if you want to adjust it.
          Nothing is sent anywhere from this page.
        </p>
      </header>
      <div className="section-list">
        {sections.map((section) => {
          const done = section.questions.filter((question) => answers[question.id]).length
          const start = questions.findIndex((question) => question.sectionId === section.id)
          return (
            <button key={section.id} type="button" className="section-link" onClick={() => onEdit(start)}>
              <span>{section.title}</span>
              <em>
                {done} of {section.questions.length} answered
              </em>
            </button>
          )
        })}
      </div>
      {missing !== null && (
        <p className="error" role="alert">
          One or more questions are still open. The report needs an answer for each, even if the
          answer is “not sure”.
        </p>
      )}
      <div className="nav">
        <button className="btn ghost" type="button" onClick={onBack}>
          Back
        </button>
        <button className="btn" type="button" disabled={missing !== null} onClick={onReport}>
          See the report
        </button>
      </div>
    </section>
  )
}
