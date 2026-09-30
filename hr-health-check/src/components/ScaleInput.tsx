interface ScaleInputProps {
  value: number | null
  min: number
  max: number
  minLabel: string
  maxLabel: string
  onChange: (value: number) => void
  name: string
}

export function ScaleInput({ value, min, max, minLabel, maxLabel, onChange, name }: ScaleInputProps) {
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)

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
