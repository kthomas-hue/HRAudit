import type { ContactInfo } from '../hooks/useAssessmentState'
import type { Answers, ResultsSummary } from '../data/scoring'

export interface SubmissionSnapshot {
  overall: number
  bandLabel: string
  categories: { categoryId: string; name: string; score: number }[]
  priorities: { categoryId: string; name: string; score: number }[]
  strengths: { categoryId: string; name: string; score: number }[]
}

export interface ClientSubmission {
  id: string
  createdAt: string
  contact: ContactInfo
  answers: Answers
  snapshot: SubmissionSnapshot
  /** Content pack version / timestamp when completed */
  contentUpdatedAt?: string
}

export const RESPONSES_STORAGE_KEY = 'dreamstone-hr-submissions-v1'
export const RESPONSE_SAVED_FLAG_KEY = 'dreamstone-hr-last-saved-submission-id'

export function snapshotFromResults(
  results: ResultsSummary,
  bandLabel: string,
): SubmissionSnapshot {
  return {
    overall: results.overall,
    bandLabel,
    categories: results.categories.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      score: c.score,
    })),
    priorities: results.priorities.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      score: c.score,
    })),
    strengths: results.strengths.map((c) => ({
      categoryId: c.categoryId,
      name: c.name,
      score: c.score,
    })),
  }
}
