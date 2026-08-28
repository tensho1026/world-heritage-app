import type { MonthlyChallenge, MonthlyChallengeInput } from '../types'
import { apiClient } from './client'

export async function getChallenges(month?: string) {
  const { data } = await apiClient.get<MonthlyChallenge[]>('/challenges', {
    params: month ? { month } : undefined,
  })
  return data
}

export async function createChallenge(input: MonthlyChallengeInput) {
  const { data } = await apiClient.post<MonthlyChallenge>('/challenges', input)
  return data
}

export async function updateChallenge(
  id: number,
  input: MonthlyChallengeInput,
) {
  const { data } = await apiClient.patch<MonthlyChallenge>(
    `/challenges/${id}`,
    input,
  )
  return data
}

export async function deleteChallenge(id: number) {
  await apiClient.delete(`/challenges/${id}`)
}
