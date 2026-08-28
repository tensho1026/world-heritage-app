import type { ReviewRating, ReviewSummary, SavedVocabulary } from '../types'
import { apiClient } from './client'

export type SaveVocabularyInput = {
  expression: string
  translationJa: string
  sourceSentenceEn: string
  heritageSiteId: string
  sectionType: string
}

export async function getVocabulary(options?: {
  search?: string
  sort?: string
  heritageSiteId?: string
  memorization?: boolean
  uncertain?: boolean
}) {
  const { data } = await apiClient.get<SavedVocabulary[]>('/vocabulary', {
    params: options,
  })
  return data
}

export async function saveVocabulary(input: SaveVocabularyInput) {
  const { data } = await apiClient.post<SavedVocabulary>('/vocabulary', input)
  return data
}

export async function deleteVocabulary(id: number) {
  await apiClient.delete(`/vocabulary/${id}`)
}

export async function updateVocabularyLearningState(
  id: number,
  changes: { isInMemorization?: boolean; isUncertain?: boolean },
) {
  const { data } = await apiClient.patch<SavedVocabulary>(
    `/vocabulary/${id}/learning-state`,
    changes,
  )
  return data
}

export async function getDueVocabulary() {
  const { data } = await apiClient.get<SavedVocabulary[]>(
    '/vocabulary/review/due',
  )
  return data
}

export async function getReviewSummary() {
  const { data } = await apiClient.get<ReviewSummary>(
    '/vocabulary/review/summary',
  )
  return data
}

export async function recordVocabularyReview(id: number, rating: ReviewRating) {
  const { data } = await apiClient.post<SavedVocabulary>(
    `/vocabulary/${id}/reviews`,
    { rating },
  )
  return data
}
