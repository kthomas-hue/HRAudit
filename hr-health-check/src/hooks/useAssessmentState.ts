import { useCallback, useEffect, useState } from 'react'
import type { Answers } from '../data/scoring'

export interface ContactInfo {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
}

export type Step = 'landing' | 'contact' | 'assessment' | 'results'

export interface PersistedState {
  step: Step
  categoryIndex: number
  questionIndex: number
  contact: ContactInfo
  answers: Answers
  privacyAccepted: boolean
  completedAt?: string
}

const STORAGE_KEY = 'dreamstone-hr-health-check-v2'

const emptyContact: ContactInfo = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  company: '',
}

const defaultState: PersistedState = {
  step: 'landing',
  categoryIndex: 0,
  questionIndex: -1,
  contact: emptyContact,
  answers: {},
  privacyAccepted: false,
}

function load(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    return { ...defaultState, ...JSON.parse(raw) }
  } catch {
    return defaultState
  }
}

export function useAssessmentState() {
  const [state, setState] = useState<PersistedState>(() =>
    typeof window === 'undefined' ? defaultState : load(),
  )
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const saved = load()
    setState({
      ...saved,
      step: 'landing',
    })
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state, hydrated])

  const setStep = useCallback((step: Step) => setState((s) => ({ ...s, step })), [])
  const setPosition = useCallback((categoryIndex: number, questionIndex: number) => {
    setState((s) => ({ ...s, categoryIndex, questionIndex }))
  }, [])
  const setContact = useCallback(
    (contact: ContactInfo) => setState((s) => ({ ...s, contact })),
    [],
  )
  const setPrivacyAccepted = useCallback(
    (privacyAccepted: boolean) => setState((s) => ({ ...s, privacyAccepted })),
    [],
  )
  const setAnswer = useCallback((id: string, value: Answers[string]) => {
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: value } }))
  }, [])

  const complete = useCallback(() => {
    setState((s) => ({
      ...s,
      step: 'results',
      completedAt: new Date().toISOString(),
    }))
  }, [])

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setState(defaultState)
  }, [])

  const resume = useCallback(() => {
    setState((s) => {
      if (s.completedAt) return { ...s, step: 'results' }
      if (Object.keys(s.answers).length > 0) return { ...s, step: 'assessment' }
      if (s.contact.email || s.contact.firstName) return { ...s, step: 'assessment' }
      return { ...s, step: 'contact' }
    })
  }, [])

  return {
    state,
    hydrated,
    setStep,
    setPosition,
    setContact,
    setPrivacyAccepted,
    setAnswer,
    complete,
    reset,
    resume,
  }
}
