import type { ArticleHighlight } from '../types'
import { apiClient } from './client'

export type SaveHighlightInput = Pick<
  ArticleHighlight,
  | 'heritageSiteId'
  | 'sectionKey'
  | 'startOffset'
  | 'endOffset'
  | 'selectedText'
  | 'noteJa'
  | 'difficultyReason'
  | 'reasonDetail'
>

export async function getHighlights(heritageSiteId: string) {
  const { data } = await apiClient.get<ArticleHighlight[]>(
    `/highlights/site/${heritageSiteId}`,
  )
  return data
}

export async function saveHighlight(input: SaveHighlightInput) {
  const { data } = await apiClient.post<ArticleHighlight>('/highlights', input)
  return data
}

export async function updateHighlight(
  id: number,
  input: Pick<
    SaveHighlightInput,
    'noteJa' | 'difficultyReason' | 'reasonDetail'
  >,
) {
  const { data } = await apiClient.patch<ArticleHighlight>(
    `/highlights/${id}`,
    input,
  )
  return data
}

export async function deleteHighlight(id: number) {
  await apiClient.delete(`/highlights/${id}`)
}
