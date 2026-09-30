type Props = {
  onHome?: () => void
}

export function Mark({ onHome }: Props) {
  const graphic = (
    <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="mark" x1="4" y1="6" x2="28" y2="26">
          <stop offset="0" stopColor="#a45ca8" />
          <stop offset="0.55" stopColor="#5a92c6" />
          <stop offset="1" stopColor="#2f9bc4" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="#1c2430" />
      <path
        fill="url(#mark)"
        d="M8 21c2.1-6.2 4.9-9.8 8-11.2 3.1 1.4 5.9 5 8 11.2-2.3 1.7-5 2.6-8 2.6s-5.7-.9-8-2.6z"
      />
    </svg>
  )
  if (!onHome) {
    return (
      <span className="mark">
        {graphic}
        <strong>DreamStoneHR</strong>
      </span>
    )
  }
  return (
    <button className="mark" type="button" onClick={onHome}>
      {graphic}
      <strong>DreamStoneHR</strong>
    </button>
  )
}
