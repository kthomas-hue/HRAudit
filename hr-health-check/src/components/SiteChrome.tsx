import { Logo } from './Logo'

function phoneToTel(phone: string) {
  const digits = phone.replace(/[^\d+]/g, '')
  return digits.startsWith('+') ? digits : digits.replace(/^0/, '+61')
}

export function SiteHeader({
  compact = false,
  productName = 'HR Health Check',
  phone = '(02) 8320 9320',
  websiteUrl = 'https://www.dreamstonehr.com.au',
}: {
  compact?: boolean
  productName?: string
  phone?: string
  websiteUrl?: string
}) {
  return (
    <header className={`site-header ${compact ? 'is-compact' : ''}`}>
      <div className="site-header__inner">
        <a href={websiteUrl} className="site-header__brand" target="_blank" rel="noreferrer">
          <Logo size="sm" />
        </a>
        <div className="site-header__meta">
          <span>{productName}</span>
          <a href={`tel:${phoneToTel(phone)}`}>{phone}</a>
        </div>
      </div>
    </header>
  )
}

export function SiteFooter({
  email = 'info@dreamstonehr.com.au',
  phone = '(02) 8320 9320',
  websiteUrl = 'https://www.dreamstonehr.com.au',
}: {
  email?: string
  phone?: string
  websiteUrl?: string
}) {
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
            <a href={`tel:${phoneToTel(phone)}`}>{phone}</a>
            <a href={`mailto:${email}`}>{email}</a>
            <a href={websiteUrl} target="_blank" rel="noreferrer">
              www.dreamstonehr.com.au
            </a>
          </div>
        </div>
        <p className="site-footer__copy">© {new Date().getFullYear()} DreamStoneHR. All rights reserved.</p>
      </div>
    </footer>
  )
}
