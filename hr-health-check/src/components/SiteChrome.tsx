import { Logo } from './Logo'

export function SiteHeader({ compact = false }: { compact?: boolean }) {
  return (
    <header className={`site-header ${compact ? 'is-compact' : ''}`}>
      <div className="site-header__inner">
        <a
          href="https://www.dreamstonehr.com.au"
          className="site-header__brand"
          target="_blank"
          rel="noreferrer"
        >
          <Logo size="sm" />
        </a>
        <div className="site-header__meta">
          <span>HR Health Check</span>
          <a href="tel:+61283209320">(02) 8320 9320</a>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Logo inverted size="md" />
        <div className="site-footer__grid">
          <div>
            <h3>We are your HR Partner</h3>
            <p>
              We work with you to solve people challenges, build stronger teams, and create a workplace that
              performs.
            </p>
          </div>
          <div className="site-footer__contact">
            <a href="tel:+61283209320">(02) 8320 9320</a>
            <a href="mailto:info@dreamstonehr.com.au">info@dreamstonehr.com.au</a>
            <a href="https://www.dreamstonehr.com.au" target="_blank" rel="noreferrer">
              www.dreamstonehr.com.au
            </a>
          </div>
        </div>
        <p className="site-footer__copy">© {new Date().getFullYear()} DreamStoneHR. All rights reserved.</p>
      </div>
    </footer>
  )
}
