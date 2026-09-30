interface LogoProps {
  variant?: 'full' | 'mark'
  inverted?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ variant = 'full', inverted = false, className = '', size = 'md' }: LogoProps) {
  if (variant === 'mark') {
    return (
      <img
        src="/logo-mark.png"
        alt="DreamStoneHR"
        className={`brand-mark brand-mark--${size} ${className}`.trim()}
      />
    )
  }

  // Official lockup is dark charcoal — on dark backgrounds use mark + white wordmark fallback
  if (inverted) {
    return (
      <div className={`brand-logo brand-logo--inverted brand-logo--${size} ${className}`.trim()}>
        <img src="/logo-mark.png" alt="" className="brand-logo__mark-img" />
        <div className="brand-logo__wordmark">
          <span className="brand-logo__dream">DREAMSTONE</span>
          <span className="brand-logo__rule" />
          <span className="brand-logo__hr">HR</span>
        </div>
      </div>
    )
  }

  return (
    <img
      src="/logo-full.png"
      alt="DreamStoneHR"
      className={`brand-full brand-full--${size} ${className}`.trim()}
    />
  )
}
