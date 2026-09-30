import { useAssessmentState } from './hooks/useAssessmentState'
import { Landing } from './components/Landing'
import { ContactForm } from './components/ContactForm'
import { Assessment } from './components/Assessment'
import { Results } from './components/Results'
import { SiteFooter, SiteHeader } from './components/SiteChrome'
import './styles/app.css'

function App() {
  const {
    state,
    hydrated,
    setStep,
    setCategoryIndex,
    setContact,
    setPrivacyAccepted,
    setAnswer,
    complete,
    reset,
    resume,
  } = useAssessmentState()

  if (!hydrated) {
    return (
      <div className="app-shell app-shell--loading">
        <div className="loader" aria-label="Loading" />
      </div>
    )
  }

  const hasSavedWork =
    !!state.completedAt ||
    Object.keys(state.answers).length > 0 ||
    !!state.contact.firstName ||
    !!state.contact.email

  return (
    <div className="app-shell">
      {state.step !== 'landing' && state.step !== 'results' && <SiteHeader compact />}

      <main>
        {state.step === 'landing' && (
          <Landing
            hasProgress={hasSavedWork}
            hasResults={!!state.completedAt}
            onStart={() => setStep('contact')}
            onResume={resume}
            onReset={() => reset()}
          />
        )}

        {state.step === 'contact' && (
          <ContactForm
            initial={state.contact}
            privacyAccepted={state.privacyAccepted}
            onPrivacyChange={setPrivacyAccepted}
            onBack={() => setStep('landing')}
            onSubmit={(contact) => {
              setContact(contact)
              setStep('assessment')
            }}
          />
        )}

        {state.step === 'assessment' && (
          <Assessment
            categoryIndex={state.categoryIndex}
            answers={state.answers}
            onAnswer={setAnswer}
            onCategoryChange={setCategoryIndex}
            onComplete={complete}
            onBackToContact={() => setStep('contact')}
          />
        )}

        {state.step === 'results' && (
          <Results contact={state.contact} answers={state.answers} onRestart={reset} />
        )}
      </main>

      <SiteFooter />
    </div>
  )
}

export default App
