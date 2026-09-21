import type { WorldHeritageSite } from '../types'
import { apiClient } from './client'

export async function getRandomHeritage() {
  const { data } = await apiClient.get<WorldHeritageSite>('/random-heritage')
  return data
}
