import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { categories, feedbackQuestion, getQuestionsForCategory } from '../data/questions'
import type { Answers } from '../data/scoring'
import { Progress } from './Progress'
import { QuestionCard } from './QuestionCard'

interface AssessmentProps {
  categoryIndex: number
  answers: Answers
  onAnswer: (id: string, value: Answers[string]) => void
  onCategoryChange: (index: number) => void
  onComplete: () => void
  onBackToContact: () => void
}

function isAnswered(value: Answers[string], questionType: string, required: boolean): boolean {
  if (!required) return true
  if (questionType === 'multi') return Array.isArray(value) // empty array is a valid "none" selection
  if (value === null || value === undefined || value === '') return false
  return true
}

export function Assessment({
  categoryIndex,
  answers,
  onAnswer,
  onCategoryChange,
  onComplete,
  onBackToContact,
}: AssessmentProps) {
  const category = categories[categoryIndex]
  const stepQuestions = useMemo(() => getQuestionsForCategory(category.id), [category.id])
  const isLast = categoryIndex === categories.length - 1
  const [showErrors, setShowErrors] = useState(false)
  const topRef = useRef<HTMLElement>(null)

  const unanswered = stepQuestions.filter((q) => {
    const required = q.required !== false && q.type !== 'text'
    const value = answers[q.id]
    // Multi-select: treat missing as unanswered until user interacts; empty array is valid
    if (q.type === 'multi' && required && value === undefined) return true
    return !isAnswered(value ?? (q.type === 'multi' ? [] : null), q.type, required)
  })

  const answeredCount = stepQuestions.length - unanswered.length

  useEffect(() => {
    setShowErrors(false)
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [categoryIndex])

  const goNext = () => {
    if (unanswered.length) {
      setShowErrors(true)
      const first = unanswered[0]
      document.getElementById(`q-${first.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (isLast) {
      // include optional feedback — always allow
      onComplete()
      return
    }
    onCategoryChange(categoryIndex + 1)
  }

  const goPrev = () => {
    if (categoryIndex === 0) {
      onBackToContact()
      return
    }
    onCategoryChange(categoryIndex - 1)
  }

  return (
    <section className="assessment" ref={topRef}>
      <div className="assessment__banner">
        <div className="assessment__banner-inner">
          <p className="eyebrow eyebrow--light">HR Health Check</p>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>
        <div className="assessment__banner-mark" aria-hidden />
      </div>

      <div className="assessment__body">
        <Progress
          categoryIndex={categoryIndex}
          answeredInStep={answeredCount}
          totalInStep={stepQuestions.length}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="assessment__questions"
          >
            {stepQuestions.map((q, i) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={i}
                answer={answers[q.id] ?? null}
                onChange={(v) => onAnswer(q.id, v)}
                showError={showErrors}
              />
            ))}

            {isLast && (
              <QuestionCard
                question={feedbackQuestion}
                index={stepQuestions.length}
                answer={answers[feedbackQuestion.id] ?? ''}
                onChange={(v) => onAnswer(feedbackQuestion.id, v)}
              />
            )}
          </motion.div>
        </AnimatePresence>

        <div className="assessment__nav">
          <button type="button" className="btn btn--ghost" onClick={goPrev}>
            ← Previous
          </button>
          <button type="button" className="btn btn--lime" onClick={goNext}>
            {isLast ? 'Submit my answers' : 'Next section'}
            <span className="btn__arrow" aria-hidden>
              →
            </span>
          </button>
        </div>
      </div>
    </section>
  )
}
