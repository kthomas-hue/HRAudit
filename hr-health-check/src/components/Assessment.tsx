import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { Question } from '../data/questions'
import type { Answers, AnswerValue } from '../data/scoring'
import { useContent } from '../content/ContentProvider'
import { QuestionCard } from './QuestionCard'

interface AssessmentProps {
  categoryIndex: number
  questionIndex: number
  answers: Answers
  onAnswer: (id: string, value: Answers[string]) => void
  onPositionChange: (categoryIndex: number, questionIndex: number) => void
  onComplete: () => void
  onBackToContact: () => void
}

function isAnswered(q: Question, value: Answers[string]): boolean {
  if (q.type === 'text' || q.required === false) return true
  if (q.type === 'multi') return value !== undefined && Array.isArray(value)
  if (value === null || value === undefined || value === '') return false
  return true
}

export function Assessment({
  categoryIndex,
  questionIndex,
  answers,
  onAnswer,
  onPositionChange,
  onComplete,
  onBackToContact,
}: AssessmentProps) {
  const { content } = useContent()
  const categories = content.categories
  const allQuestions = content.questions
  const category = categories[categoryIndex]
  const stepQuestions = useMemo(
    () => allQuestions.filter((q) => q.categoryId === category?.id),
    [allQuestions, category?.id],
  )
  const isIntro = questionIndex < 0
  const isLastCategory = categoryIndex === categories.length - 1
  const showingFeedback = isLastCategory && questionIndex >= stepQuestions.length
  const feedbackQuestion: Question = {
    id: 'feedback',
    categoryId: category?.id ?? 'psychosocial',
    type: 'text',
    required: false,
    prompt: content.feedbackPrompt,
    placeholder: content.feedbackPlaceholder,
  }
  const currentQuestion = showingFeedback
    ? feedbackQuestion
    : isIntro
      ? null
      : stepQuestions[questionIndex]

  const answeredSoFar = allQuestions.filter((q) => {
    const v = answers[q.id]
    if (q.type === 'multi') return Array.isArray(v)
    return v !== null && v !== undefined && v !== ''
  }).length
  const overallPct = Math.round((answeredSoFar / Math.max(allQuestions.length, 1)) * 100)

  const [shake, setShake] = useState(false)
  const stageRef = useRef<HTMLElement>(null)
  const guidance = category ? content.guidance[category.id] : undefined

  useEffect(() => {
    stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [categoryIndex, questionIndex])

  const canContinue = (() => {
    if (isIntro) return true
    if (showingFeedback) return true
    if (!currentQuestion) return false
    if (currentQuestion.type === 'multi' || currentQuestion.type === 'text') return true
    return isAnswered(currentQuestion, answers[currentQuestion.id])
  })()

  const goNext = () => {
    if (!canContinue) {
      setShake(true)
      window.setTimeout(() => setShake(false), 420)
      return
    }

    if (currentQuestion?.type === 'multi' && answers[currentQuestion.id] === undefined) {
      onAnswer(currentQuestion.id, [])
    }

    if (isIntro) {
      onPositionChange(categoryIndex, 0)
      return
    }

    if (showingFeedback) {
      onComplete()
      return
    }

    if (questionIndex < stepQuestions.length - 1) {
      onPositionChange(categoryIndex, questionIndex + 1)
      return
    }

    if (isLastCategory) {
      onPositionChange(categoryIndex, stepQuestions.length)
      return
    }

    onPositionChange(categoryIndex + 1, -1)
  }

  const goPrev = () => {
    if (isIntro) {
      if (categoryIndex === 0) {
        onBackToContact()
        return
      }
      const prevCat = categories[categoryIndex - 1]
      const prevQs = allQuestions.filter((q) => q.categoryId === prevCat.id)
      onPositionChange(categoryIndex - 1, prevQs.length - 1)
      return
    }

    if (showingFeedback) {
      onPositionChange(categoryIndex, stepQuestions.length - 1)
      return
    }

    if (questionIndex === 0) {
      onPositionChange(categoryIndex, -1)
      return
    }

    onPositionChange(categoryIndex, questionIndex - 1)
  }

  const handleAnswer = (value: AnswerValue) => {
    if (!currentQuestion) return
    onAnswer(currentQuestion.id, value)

    if (
      currentQuestion.type === 'yesno' ||
      currentQuestion.type === 'single' ||
      currentQuestion.type === 'scale'
    ) {
      window.setTimeout(() => {
        if (questionIndex < stepQuestions.length - 1) {
          onPositionChange(categoryIndex, questionIndex + 1)
        } else if (isLastCategory) {
          onPositionChange(categoryIndex, stepQuestions.length)
        } else {
          onPositionChange(categoryIndex + 1, -1)
        }
      }, 420)
    }
  }

  if (!category) return null

  return (
    <section className="wizard" ref={stageRef}>
      <div className="wizard__top">
        <div className="wizard__progress" aria-label={`Assessment ${overallPct}% complete`}>
          <div className="wizard__progress-fill" style={{ width: `${overallPct}%` }} />
        </div>
        <div className="wizard__meta">
          <span className="wizard__chapter">
            Section {categoryIndex + 1} / {categories.length} · {category.shortName}
          </span>
          <span className="wizard__pct">{overallPct}%</span>
        </div>
      </div>

      <div className="wizard__stage">
        <AnimatePresence mode="wait">
          {isIntro ? (
            <motion.div
              key={`intro-${category.id}`}
              className="wizard__intro"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="eyebrow">Section {categoryIndex + 1} of {categories.length}</p>
              <h1>
                <span className="highlight-lime">{category.name}</span>
              </h1>
              <p className="lead">{category.description}</p>
              {guidance?.stakes && <p className="wizard__stakes">{guidance.stakes}</p>}
              <p className="wizard__count">{stepQuestions.length} questions in this section</p>
              <button type="button" className="btn btn--lime" onClick={goNext}>
                Continue
                <span className="btn__arrow" aria-hidden>
                  ↗
                </span>
              </button>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion?.id ?? 'q'}
              className={`wizard__question ${shake ? 'is-shake' : ''}`}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            >
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  index={showingFeedback ? stepQuestions.length : questionIndex}
                  answer={
                    (answers[currentQuestion.id] as AnswerValue | undefined) ??
                    (currentQuestion.type === 'multi' ? [] : null)
                  }
                  onChange={handleAnswer}
                  showError={shake && !canContinue}
                  focused
                />
              )}

              {(currentQuestion?.type === 'multi' ||
                currentQuestion?.type === 'text' ||
                showingFeedback) && (
                <div className="wizard__actions">
                  <button type="button" className="btn btn--ghost" onClick={goPrev}>
                    Back
                  </button>
                  <button type="button" className="btn btn--lime" onClick={goNext}>
                    {showingFeedback ? 'See my results' : 'Continue'}
                    <span className="btn__arrow" aria-hidden>
                      ↗
                    </span>
                  </button>
                </div>
              )}

              {currentQuestion &&
                (currentQuestion.type === 'yesno' ||
                  currentQuestion.type === 'single' ||
                  currentQuestion.type === 'scale') && (
                  <div className="wizard__actions wizard__actions--subtle">
                    <button type="button" className="text-link" onClick={goPrev}>
                      ← Back
                    </button>
                    <span className="wizard__hint">Select an answer to continue</span>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="wizard__rail" aria-hidden>
        {categories.map((c, i) => (
          <span
            key={c.id}
            className={`wizard__rail-dot ${i < categoryIndex ? 'is-done' : ''} ${i === categoryIndex ? 'is-current' : ''}`}
            style={{ ['--dot' as string]: c.accent }}
          />
        ))}
      </div>
    </section>
  )
}
