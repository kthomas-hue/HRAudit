import { Logo } from './Logo'

interface LandingProps {
  onStart: () => void
  hasProgress: boolean
  hasResults?: boolean
  onResume: () => void
  onReset: () => void
}

export function Landing({ onStart, hasProgress, hasResults = false, onResume, onReset }: LandingProps) {
  return (
    <section className="landing">
      <div className="landing__hero">
        <div className="landing__orb landing__orb--a" aria-hidden />
        <div className="landing__orb landing__orb--b" aria-hidden />
        <div className="landing__content">
          <Logo className="landing__logo" />
          <p className="eyebrow">Self-assessment for business leaders</p>
          <h1>
            <span className="highlight-lime">HR Health Check</span>
          </h1>
          <p className="lead">
            A practical review of your HR foundations — documentation, policies, recruitment, onboarding,
            employee management, workplace conduct, safety, and risk — so you know where you stand and what
            needs attention.
          </p>
          <ul className="landing__bullets">
            <li>Takes about 15–20 minutes</li>
            <li>Instant personalised scorecard across 12 HR areas</li>
            <li>Practical next steps from your DreamStoneHR partner</li>
          </ul>
          <div className="landing__actions">
            {hasProgress ? (
              <>
                <button type="button" className="btn btn--lime" onClick={onResume}>
                  {hasResults ? 'View your results' : 'Continue where you left off'}
                  <span className="btn__arrow" aria-hidden>
                    →
                  </span>
                </button>
                <button type="button" className="btn btn--ghost" onClick={onReset}>
                  Start fresh
                </button>
              </>
            ) : (
              <button type="button" className="btn btn--lime" onClick={onStart}>
                Begin your HR Health Check
                <span className="btn__arrow" aria-hidden>
                  →
                </span>
              </button>
            )}
          </div>
          <p className="landing__privacy">
            By continuing, you agree to our{' '}
            <a href="https://www.dreamstonehr.com.au" target="_blank" rel="noreferrer">
              privacy policy
            </a>
            .
          </p>
        </div>
      </div>

      <div className="landing__trust">
        <div className="landing__trust-inner">
          <h2>
            You’re in the <span className="highlight-magenta">right place</span>
          </h2>
          <p>
            DreamStoneHR partners with growing businesses to build practical, people-first solutions that drive
            performance. This Health Check surfaces gaps early — before they become costly.
          </p>
          <div className="landing__pillars">
            <article>
              <h3>Compliance clarity</h3>
              <p>Awards, NES, contracts and pay arrangements reviewed through a business-owner lens.</p>
            </article>
            <article>
              <h3>People foundations</h3>
              <p>Recruitment, onboarding, policies and performance — the systems that keep teams healthy.</p>
            </article>
            <article>
              <h3>Risk & culture</h3>
              <p>Psychosocial risk, positive duty, safety and engagement — where today’s legislation bites.</p>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
