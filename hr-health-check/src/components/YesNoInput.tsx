interface YesNoInputProps {
  value: boolean | null
  onChange: (value: boolean) => void
  name: string
}

export function YesNoInput({ value, onChange, name }: YesNoInputProps) {
  return (
    <div className="yesno" role="radiogroup" aria-label={name}>
      <button
        type="button"
        role="radio"
        aria-checked={value === true}
        className={`yesno__btn ${value === true ? 'is-selected' : ''}`}
        onClick={() => onChange(true)}
      >
        Yes
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === false}
        className={`yesno__btn ${value === false ? 'is-selected' : ''}`}
        onClick={() => onChange(false)}
      >
        No
      </button>
    </div>
  )
}
