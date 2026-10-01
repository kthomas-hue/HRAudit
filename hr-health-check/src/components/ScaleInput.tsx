interface ScaleInputProps {
  value: number | null
  min: number
  max: number
  minLabel: string
  maxLabel: string
  stepLabels?: string[]
  onChange: (value: number) => void
  name: string
}

export function ScaleInput({
  value,
  min,
  max,
  minLabel,
  maxLabel,
  stepLabels,
  onChange,
  name,
}: ScaleInputProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
  const hasSteps = !!stepLabels && stepLabels.length >= values.length

  if (hasSteps) {
    return (
      <div className="scale-list" role="radiogroup" aria-label={name}>
        <p className="scale-list__guide">
          Choose the statement that best matches your reality today — not where you hope to be.
        </p>
        <div className="scale-list__options">
          {values.map((n, i) => {
            const selected = value === n
            const label = stepLabels[i] ?? `${n}`
            return (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={selected}
                className={`scale-list__option ${selected ? 'is-selected' : ''}`}
                onClick={() => onChange(n)}
              >
                <span className="scale-list__num">{n}</span>
                <span className="scale-list__text">{label.replace(/^\d+\s*[—-]\s*/, '')}</span>
              </button>
            )
          })}
        </div>
        <div className="scale-list__ends" aria-hidden>
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="scale-input" role="radiogroup" aria-label={name}>
      <div className="scale-input__labels">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
      <div className="scale-input__track">
        {values.map((n) => {
          const selected = value === n
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`scale-input__pip ${selected ? 'is-selected' : ''}`}
              onClick={() => onChange(n)}
            >
              <span className="scale-input__num">{n}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
