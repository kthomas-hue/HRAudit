import type { Question } from '../data/questions'
import type { AnswerValue } from '../data/scoring'
import { ScaleInput } from './ScaleInput'
import { YesNoInput } from './YesNoInput'
import { ChoiceList } from './ChoiceList'

interface QuestionCardProps {
  question: Question
  index: number
  answer: AnswerValue
  onChange: (value: AnswerValue) => void
  showError?: boolean
}

export function QuestionCard({ question, index, answer, onChange, showError }: QuestionCardProps) {
  const unanswered =
    answer === null ||
    answer === undefined ||
    answer === '' ||
    (Array.isArray(answer) && answer.length === 0)

  return (
    <article className={`question-card ${showError && unanswered ? 'has-error' : ''}`} id={`q-${question.id}`}>
      <header className="question-card__head">
        <span className="question-card__num">{String(index + 1).padStart(2, '0')}</span>
        <div>
          <h3>{question.prompt}</h3>
          {question.helpText && <p className="question-card__help">{question.helpText}</p>}
        </div>
      </header>

      <div className="question-card__body">
        {question.type === 'scale' && question.scale && (
          <ScaleInput
            name={question.prompt}
            value={typeof answer === 'number' ? answer : null}
            min={question.scale.min}
            max={question.scale.max}
            minLabel={question.scale.minLabel}
            maxLabel={question.scale.maxLabel}
            onChange={onChange}
          />
        )}

        {question.type === 'yesno' && (
          <YesNoInput
            name={question.prompt}
            value={typeof answer === 'boolean' ? answer : null}
            onChange={onChange}
          />
        )}

        {question.type === 'single' && question.options && (
          <ChoiceList
            name={question.prompt}
            options={question.options}
            value={typeof answer === 'string' ? answer : null}
            onChange={onChange}
          />
        )}

        {question.type === 'multi' && question.options && (
          <ChoiceList
            name={question.prompt}
            options={question.options}
            value={Array.isArray(answer) ? answer : []}
            multiple
            onChange={onChange}
          />
        )}

        {question.type === 'text' && (
          <textarea
            className="text-area"
            rows={4}
            placeholder={question.placeholder}
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        )}
      </div>

      {showError && unanswered && question.required !== false && question.type !== 'text' && (
        <p className="field-error" role="alert">
          Please answer this question to continue.
        </p>
      )}
    </article>
  )
}
