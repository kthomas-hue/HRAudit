import type { ChoiceOption } from '../data/questions'

interface ChoiceListProps {
  options: ChoiceOption[]
  value: string | string[] | null
  multiple?: boolean
  onChange: (value: string | string[]) => void
  name: string
}

export function ChoiceList({ options, value, multiple = false, onChange, name }: ChoiceListProps) {
  const selected = new Set(Array.isArray(value) ? value : value ? [value] : [])

  const toggle = (id: string) => {
    if (multiple) {
      const next = new Set(selected)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      onChange([...next])
    } else {
      onChange(id)
    }
  }

  return (
    <div className={`choice-list ${multiple ? 'is-multi' : ''}`} role={multiple ? 'group' : 'radiogroup'} aria-label={name}>
      {options.map((opt) => {
        const isOn = selected.has(opt.id)
        return (
          <button
            key={opt.id}
            type="button"
            role={multiple ? 'checkbox' : 'radio'}
            aria-checked={isOn}
            className={`choice-list__item ${isOn ? 'is-selected' : ''}`}
            onClick={() => toggle(opt.id)}
          >
            <span className={`choice-list__control ${multiple ? 'is-check' : 'is-radio'}`} aria-hidden>
              {isOn && <span className="choice-list__dot" />}
            </span>
            <span className="choice-list__label">{opt.label}</span>
          </button>
        )
      })}
    </div>
  )
}
