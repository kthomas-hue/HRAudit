import { useContent } from '../content/ContentProvider'
import { Logo } from './Logo'

interface LandingProps {
  onStart: () => void
  hasProgress: boolean
  hasResults?: boolean
  onResume: () => void
  onReset: () => void
}

export function Landing({ onStart, hasProgress, hasResults = false, onResume, onReset }: LandingProps) {
  const { content } = useContent()
  const { settings } = content

  const headline = settings.landingHeadline
  const highlightMatch = headline.match(/^(.*?)(exposed|risk|ready)(.*)$/i)
  const headlineNodes = highlightMatch ? (
    <>
      {highlightMatch[1]}
      <span className="highlight-lime">{highlightMatch[2]}</span>
      {highlightMatch[3]}
    </>
  ) : (
    headline
  )

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
          <p className="eyebrow">{settings.tagline}</p>
          <h1>{headlineNodes}</h1>
          <p className="lead">{settings.landingLead}</p>

          <div className="landing__actions">
            {hasProgress ? (
              <>
                <button type="button" className="btn btn--lime" onClick={onResume}>
                  {hasResults ? 'View your leadership report' : 'Continue where you left off'}
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
            Takes 15–20 minutes · Instant leadership report ·{' '}
            <a href={settings.privacyUrl} target="_blank" rel="noreferrer">
              Privacy policy
            </a>
          </p>
        </div>

        <aside className="landing__panel">
          <p className="landing__panel-tag">What you’ll walk away with</p>
          <ul>
            <li>
              <strong>A clear risk map</strong>
              <span>
                Where Fair Work, contracts, safety, performance and culture are actually exposed — ranked so you
                know what to tackle first
              </span>
            </li>
            <li>
              <strong>A leadership report worth paying for</strong>
              <span>
                Timed actions, DreamStoneHR resources, and external links — a working plan, not a score dump
              </span>
            </li>
            <li>
              <strong>A partner-ready next step</strong>
              <span>Shareable PDF report and action plan so DreamStoneHR can help you close the gaps fast</span>
            </li>
          </ul>
          <div className="landing__panel-foot">
            <Logo variant="mark" size="sm" />
            <p>Built for leaders who want a real handle on their HR — not a tick-and-flick quiz.</p>
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
            performance. This Health Check is a self-audit that surfaces gaps early — before they become costly.
          </p>
        </div>
      </div>
    </section>
  )
}
