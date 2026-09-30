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
      <div className="landing__atmosphere" aria-hidden>
        <div className="facet-wash" />
        <img src="/logo-mark.png" alt="" className="landing__watermark" />
      </div>

      <div className="landing__hero">
        <Logo size="lg" className="landing__logo" />
        <p className="eyebrow">Self-assessment for business leaders</p>
        <h1>
          Your <span className="highlight-lime">HR Health Check</span>
        </h1>
        <p className="lead">
          A calm, guided review of your people foundations — so you can see what’s working, where the gaps
          are, and what deserves attention next.
        </p>

        <ul className="landing__bullets">
          <li>
            <strong>15–20 minutes</strong>
            <span>One clear question at a time</span>
          </li>
          <li>
            <strong>12 HR chapters</strong>
            <span>From pay & contracts to culture & risk</span>
          </li>
          <li>
            <strong>Instant scorecard</strong>
            <span>Priorities you can act on with DreamStoneHR</span>
          </li>
        </ul>

        <div className="landing__actions">
          {hasProgress ? (
            <>
              <button type="button" className="btn btn--lime" onClick={onResume}>
                {hasResults ? 'View your results' : 'Continue where you left off'}
                <span className="btn__arrow" aria-hidden>
                  ↗
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
                ↗
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

      <div className="landing__band">
        <div className="landing__band-inner">
          <Logo variant="mark" size="sm" />
          <h2>
            You’re in the <span className="highlight-magenta">right place</span>
          </h2>
          <p>
            DreamStoneHR partners with growing businesses to build practical, people-first solutions that
            drive performance. This Health Check surfaces gaps early — before they become costly.
          </p>
        </div>
      </div>
    </section>
  )
}
