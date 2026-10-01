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
        <div className="landing__blob landing__blob--a" />
        <div className="landing__blob landing__blob--b" />
        <img src="/logo-mark.png" alt="" className="landing__watermark" />
      </div>

      <div className="landing__hero">
        <div className="landing__copy">
          <Logo size="lg" className="landing__logo" />
          <p className="eyebrow">For business owners, GMs &amp; CEOs</p>
          <h1>
            Know where your HR is <span className="highlight-lime">exposed</span>
          </h1>
          <p className="lead">
            A practical Health Check for leaders of growing teams. In about 20 minutes you’ll see your biggest
            people risks — and the next moves worth making.
          </p>

          <div className="landing__actions">
            {hasProgress ? (
              <>
                <button type="button" className="btn btn--lime" onClick={onResume}>
                  {hasResults ? 'View your leadership brief' : 'Continue where you left off'}
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
                Start the Health Check
                <span className="btn__arrow" aria-hidden>
                  ↗
                </span>
              </button>
            )}
          </div>
          <p className="landing__privacy">
            Takes 15–20 minutes · Instant brief ·{' '}
            <a href="https://www.dreamstonehr.com.au" target="_blank" rel="noreferrer">
              Privacy policy
            </a>
          </p>
        </div>

        <aside className="landing__panel">
          <p className="landing__panel-tag">What you’ll walk away with</p>
          <ul>
            <li>
              <strong>Risk clarity</strong>
              <span>Where Fair Work, contracts, safety, and culture may be exposed</span>
            </li>
            <li>
              <strong>A leadership brief</strong>
              <span>Not just scores — what it means and what to do next</span>
            </li>
            <li>
              <strong>A partner path</strong>
              <span>Clear next conversations with DreamStoneHR</span>
            </li>
          </ul>
          <div className="landing__panel-foot">
            <Logo variant="mark" size="sm" />
            <p>Built for leaders managing roughly 25–100 people.</p>
          </div>
        </aside>
      </div>

      <div className="landing__strip">
        <div className="landing__strip-inner">
          <h2>
            You’re in the <span className="highlight-magenta">right place</span>
          </h2>
          <p>
            DreamStoneHR partners with growing businesses to build practical, people-first solutions that drive
            performance. This Health Check surfaces gaps early — before they become costly.
          </p>
        </div>
      </div>
    </section>
  )
}
