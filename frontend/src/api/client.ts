import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20_000,
})

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string') return message
  }
  return '通信に失敗しました。時間をおいて、もう一度お試しください。'
}
