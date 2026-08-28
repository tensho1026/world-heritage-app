import type { LearningCalendar, WeeklyReport } from '../types'
import { apiClient } from './client'

export async function getLearningCalendar(month: string) {
  const { data } = await apiClient.get<LearningCalendar>('/reports/calendar', {
    params: { month },
  })
  return data
}

export async function getWeeklyReport() {
  const { data } = await apiClient.get<WeeklyReport>('/reports/weekly')
  return data
}
