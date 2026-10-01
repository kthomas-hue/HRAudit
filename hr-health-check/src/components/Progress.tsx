import { categories } from '../data/questions'

interface ProgressProps {
  categoryIndex: number
  answeredInStep: number
  totalInStep: number
}

export function Progress({ categoryIndex, answeredInStep, totalInStep }: ProgressProps) {
  const overallPct = Math.round(((categoryIndex + answeredInStep / Math.max(totalInStep, 1)) / categories.length) * 100)
  const clamped = Math.min(100, Math.max(0, overallPct))

  return (
    <div className="progress-bar" aria-label={`Assessment progress ${clamped}%`}>
      <div className="progress-bar__meta">
        <span>
          Section {categoryIndex + 1} of {categories.length}
        </span>
        <span>{clamped}% complete</span>
      </div>
      <div className="progress-bar__track">
        <div className="progress-bar__fill" style={{ width: `${clamped}%` }} />
      </div>
      <div className="progress-bar__dots" aria-hidden>
        {categories.map((c, i) => (
          <span
            key={c.id}
            className={`progress-bar__dot ${i < categoryIndex ? 'is-done' : ''} ${i === categoryIndex ? 'is-current' : ''}`}
            title={c.shortName}
          />
        ))}
      </div>
    </div>
  )
}
