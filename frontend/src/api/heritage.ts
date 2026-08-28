import type {
  ComprehensionLevel,
  HeritageMode,
  HeritageStats,
  HistoryItem,
  LearningState,
  SiteSummary,
  WorldHeritageSite,
} from '../types'
import { apiClient } from './client'

export async function getRandomHeritage(mode: HeritageMode, exclude?: string) {
  const { data } = await apiClient.get<WorldHeritageSite>('/heritage/random', {
    params: { mode, ...(exclude ? { exclude } : {}) },
  })
  return data
}

export async function getHeritage(id: string) {
  const { data } = await apiClient.get<WorldHeritageSite>(`/heritage/${id}`)
  return data
}

export async function recordHeritageView(id: string) {
  const { data } = await apiClient.post(`/heritage/${id}/views`)
  return data
}

export async function recordHeritageRead(id: string) {
  const { data } = await apiClient.post<{ id: number; readAt: string }>(
    `/heritage/${id}/reads`,
  )
  return data
}

export async function undoHeritageRead(id: string, readId: number) {
  await apiClient.delete(`/heritage/${id}/reads/${readId}`)
}

export async function getLearningState(id: string) {
  const { data } = await apiClient.get<LearningState>(
    `/heritage/${id}/learning-state`,
  )
  return data
}

export async function updateComprehension(
  id: string,
  comprehensionLevel: ComprehensionLevel | null,
) {
  const { data } = await apiClient.patch<LearningState>(
    `/heritage/${id}/comprehension`,
    { comprehensionLevel },
  )
  return data
}

export async function updateFavorite(id: string, value: boolean) {
  const { data } = await apiClient.request<LearningState>({
    url: `/heritage/${id}/favorite`,
    method: value ? 'PUT' : 'DELETE',
  })
  return data
}

export async function updateReadLater(id: string, value: boolean) {
  const { data } = await apiClient.request<LearningState>({
    url: `/heritage/${id}/read-later`,
    method: value ? 'PUT' : 'DELETE',
  })
  return data
}

export async function getFavorites() {
  const { data } = await apiClient.get<SiteSummary[]>('/favorites')
  return data
}

export async function getReadLater() {
  const { data } = await apiClient.get<SiteSummary[]>('/read-later')
  return data
}

export async function getHistory() {
  const { data } = await apiClient.get<HistoryItem[]>('/history')
  return data
}

export async function getStats() {
  const { data } = await apiClient.get<HeritageStats>('/stats')
  return data
}
