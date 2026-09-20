import type { WorldHeritageSite } from '../../types'

export function paragraphs(text: string | null) {
  return text
    ? text
        .split(/\n\s*\n/)
        .map((value) => value.trim())
        .filter(Boolean)
    : []
}

export function categoryLabel(category: WorldHeritageSite['category']) {
  return { Cultural: '文化遺産', Natural: '自然遺産', Mixed: '複合遺産' }[
    category
  ]
}
