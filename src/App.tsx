import { useEffect, useState } from "react"
import { questions, type Profile } from "./content"
import { clearState, firstUnanswered, initialState, isComplete, loadState, saveState, type Answers, type ReviewState, type Step } from "./model"
import { ContextStep } from "./components/ContextStep"
import { Mark } from "./components/Mark"
import { QuestionStep } from "./components/QuestionStep"
import { ReportStep } from "./components/ReportStep"
import { ReviewStep } from "./components/ReviewStep"
import { Welcome } from "./components/Welcome"

export function App() {
  const [state, setState] = useState<ReviewState>(() => loadState())

  useEffect(() => {
    saveState(state)
  }, [state])

  function go(step: Step) {
    setState((current) => ({ ...current, step }))
  }

  function answer(questionId: string, choiceId: string) {
    setState((current) => ({
      ...current,
      answers: { ...current.answers, [questionId]: choiceId },
    }))
  }

  function restart() {
    clearState()
    setState(initialState)
  }

  function startFresh() {
    clearState()
    setState({ ...initialState, step: { name: "context" } })
  }

  function resume() {
    if (!state.profile) {
      go({ name: "context" })
      return
    }
    const missing = firstUnanswered(state.answers)
    if (missing === null) go({ name: "review" })
    else go({ name: "question", index: missing })
  }

  const hasProgress = Boolean(state.profile) || Object.keys(state.answers).length > 0
  const onReport = state.step.name === "report"

  return (
    <div className="app">
      <header className="topbar no-print">
        <Mark onHome={() => go({ name: "welcome" })} />
        <p className="top-meta">{onReport ? "Your report" : "A self-review for business owners"}</p>
      </header>
      <main className="stage">
        {state.step.name === "welcome" && (
          <Welcome canResume={hasProgress} onStart={startFresh} onResume={resume} />
        )}
        {state.step.name === "context" && (
          <ContextStep
            initial={state.profile}
            onBack={() => go({ name: "welcome" })}
            onContinue={(profile: Profile) => {
              const missing = firstUnanswered(state.answers)
              setState((current) => ({
                ...current,
                profile,
                step: { name: "question", index: missing ?? 0 },
              }))
            }}
          />
        )}
        {state.step.name === "question" && (
          <QuestionStep
            index={Math.min(state.step.index, questions.length - 1)}
            answers={state.answers}
            onAnswer={answer}
            onBack={() => {
              if (state.step.name === "question" && state.step.index === 0) go({ name: "context" })
              else if (state.step.name === "question") go({ name: "question", index: state.step.index - 1 })
            }}
            onContinue={() => {
              if (state.step.name !== "question") return
              const next = state.step.index + 1
              if (next >= questions.length) go({ name: "review" })
              else go({ name: "question", index: next })
            }}
          />
        )}
        {state.step.name === "review" && (
          <ReviewStep
            answers={state.answers}
            onEdit={(index) => go({ name: "question", index })}
            onBack={() => go({ name: "question", index: questions.length - 1 })}
            onReport={() => {
              if (isComplete(state.answers) && state.profile) go({ name: "report" })
            }}
          />
        )}
        {state.step.name === "report" && state.profile && (
          <ReportStep
            profile={state.profile}
            answers={state.answers as Answers}
            onEdit={() => go({ name: "review" })}
            onRestart={restart}
          />
        )}
      </main>
      <footer className="footer no-print">
        <span>DreamStoneHR · practical HR for growing businesses</span>
        <span>
          <a href="tel:+61283209320">(02) 8320 9320</a>
          {" · "}
          <a href="mailto:Info@dreamstonehr.com.au">Info@dreamstonehr.com.au</a>
        </span>
      </footer>
    </div>
  )
}
