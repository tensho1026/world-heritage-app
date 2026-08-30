import axios from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 20_000,
})

export function getHeritageImageUrl(id: string, width = 960) {
  const apiBaseUrl = String(apiClient.defaults.baseURL).replace(/\/$/, '')
  const query = width === 960 ? '' : `?width=${width}`
  return `${apiBaseUrl}/heritage/${encodeURIComponent(id)}/image${query}`
}

export function getApiErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (Array.isArray(message)) return message.join(' ')
    if (typeof message === 'string') return message
  }
  return '通信に失敗しました。時間をおいて、もう一度お試しください。'
}
