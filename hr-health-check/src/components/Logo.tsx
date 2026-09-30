interface LogoProps {
  variant?: 'full' | 'mark'
  inverted?: boolean
  className?: string
}

export function Logo({ variant = 'full', inverted = false, className = '' }: LogoProps) {
  return (
    <div className={`brand-logo ${inverted ? 'is-inverted' : ''} ${className}`.trim()}>
      <img src="/logo-mark.svg" alt="" className="brand-logo__mark" width={40} height={40} />
      {variant === 'full' && (
        <div className="brand-logo__wordmark">
          <span className="brand-logo__dream">DREAMSTONE</span>
          <span className="brand-logo__hr">HR</span>
        </div>
      )}
    </div>
  )
}
