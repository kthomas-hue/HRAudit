import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { questions, sections } from "../content"
import type { Answers } from "../model"

type Props = {
  index: number
  answers: Answers
  onAnswer: (questionId: string, choiceId: string) => void
  onBack: () => void
  onContinue: () => void
}

export function QuestionStep({ index, answers, onAnswer, onBack, onContinue }: Props) {
  const question = questions[index]
  const section = sections.find((item) => item.id === question.sectionId)!
  const sectionQuestions = section.questions
  const sectionIndex = sectionQuestions.findIndex((item) => item.id === question.id)
  const selected = answers[question.id] ?? ""
  const [error, setError] = useState("")
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    setError("")
    heading.current?.focus()
  }, [question.id])

  function choose(choiceId: string) {
    onAnswer(question.id, choiceId)
    setError("")
  }

  function next() {
    if (!answers[question.id]) {
      setError("Choose the answer that is closest. “I'm not sure” is a valid answer.")
      return
    }
    onContinue()
  }

  function onKeyDown(event: KeyboardEvent) {
    const number = Number(event.key)
    if (number >= 1 && number <= question.choices.length) {
      choose(question.choices[number - 1].id)
    }
  }

  const minutesLeft = Math.max(1, Math.ceil(((questions.length - index) * 18) / 60))
  const firstInSection = sectionIndex === 0

  return (
    <section className="panel" onKeyDown={onKeyDown}>
      <div className="progress" aria-hidden="true">
        <span style={{ width: `${(index / questions.length) * 100}%` }} />
      </div>
      <p className="eyebrow">
        <i />
        {section.title} · {sectionIndex + 1} of {sectionQuestions.length}
      </p>
      <p className="fine" style={{ marginTop: 0 }}>
        Question {index + 1} of {questions.length} · about {minutesLeft} {minutesLeft === 1 ? "minute" : "minutes"} left
      </p>
      {firstInSection && <p className="lede">{section.purpose}</p>}
      <h1 className="ask" ref={heading} tabIndex={-1}>
        {question.prompt}
      </h1>
      <p className="why">{question.why}</p>
      <div className="choices" role="radiogroup" aria-label={question.prompt}>
        {question.choices.map((choice, choiceIndex) => (
          <button
            key={choice.id}
            type="button"
            className="choice"
            role="radio"
            aria-checked={selected === choice.id}
            onClick={() => choose(choice.id)}
          >
            <b>{choiceIndex + 1}</b>
            <span>{choice.label}</span>
          </button>
        ))}
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
        <button className="btn" type="button" onClick={next}>
          {index === questions.length - 1 ? "Review answers" : "Continue"}
        </button>
      </div>
    </section>
  )
}
