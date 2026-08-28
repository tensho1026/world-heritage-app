import { apiClient } from './client'

export type PracticeAttemptInput = {
  heritageSiteId: string
  type: 'dictation' | 'writing'
  sourceSentenceEn: string
  answerText: string
  score: number
  hintsUsed: number
  playbackCount: number
}

export async function recordPracticeAttempt(input: PracticeAttemptInput) {
  const { data } = await apiClient.post('/practice/attempts', input)
  return data
}
