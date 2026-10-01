import { Navigate, Route, Routes } from 'react-router-dom'
import { useAssessmentState } from './hooks/useAssessmentState'
import { Landing } from './components/Landing'
import { ContactForm } from './components/ContactForm'
import { Assessment } from './components/Assessment'
import { Results } from './components/Results'
import { AdminPortal } from './components/AdminPortal'
import { SiteFooter, SiteHeader } from './components/SiteChrome'
import { useContent } from './content/ContentProvider'
import './styles/app.css'

function HealthCheckApp() {
  const { content, hydrated: contentHydrated } = useContent()
  const {
    state,
    hydrated,
    setStep,
    setPosition,
    setContact,
    setPrivacyAccepted,
    setAnswer,
    complete,
    reset,
    resume,
  } = useAssessmentState()

  if (!hydrated || !contentHydrated) {
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
      {state.step !== 'landing' && state.step !== 'results' && (
        <SiteHeader
          compact
          productName={content.settings.productName}
          phone={content.settings.contactPhone}
          websiteUrl={content.settings.websiteUrl}
        />
      )}

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
            privacyUrl={content.settings.privacyUrl}
            onPrivacyChange={setPrivacyAccepted}
            onBack={() => setStep('landing')}
            onSubmit={(contact) => {
              setContact(contact)
              setPosition(0, -1)
              setStep('assessment')
            }}
          />
        )}

        {state.step === 'assessment' && (
          <Assessment
            categoryIndex={state.categoryIndex}
            questionIndex={state.questionIndex}
            answers={state.answers}
            onAnswer={setAnswer}
            onPositionChange={setPosition}
            onComplete={complete}
            onBackToContact={() => setStep('contact')}
          />
        )}

        {state.step === 'results' && (
          <Results contact={state.contact} answers={state.answers} onRestart={reset} />
        )}
      </main>

      {state.step !== 'assessment' && (
        <SiteFooter
          email={content.settings.contactEmail}
          phone={content.settings.contactPhone}
          websiteUrl={content.settings.websiteUrl}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<HealthCheckApp />} />
      <Route path="/admin" element={<AdminPortal />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
