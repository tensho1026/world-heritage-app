import type { ArticleTranslation } from '../types'
import { apiClient } from './client'

export async function translateArticle(heritageSiteId: string) {
  const { data } = await apiClient.post<ArticleTranslation>(
    '/translations/article',
    { heritageSiteId },
  )
  return data
}

export async function translateSelection(
  expression: string,
  sourceSentenceEn: string,
) {
  const { data } = await apiClient.post<{ translationJa: string }>(
    '/translations/selection',
    { expression, sourceSentenceEn },
  )
  return data
}
