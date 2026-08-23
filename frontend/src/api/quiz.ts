import type { HeritageQuiz, QuizAttemptResult } from '../types'
import { apiClient } from './client'

export async function getQuiz(heritageSiteId: string) {
  const { data } = await apiClient.get<HeritageQuiz>(
    `/heritage/${heritageSiteId}/quiz`,
  )
  return data
}

export async function submitQuiz(
  heritageSiteId: string,
  answers: Record<string, string>,
) {
  const { data } = await apiClient.post<QuizAttemptResult>(
    `/heritage/${heritageSiteId}/quiz/attempts`,
    { answers },
  )
  return data
}
