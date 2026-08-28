import { describe, expect, it } from 'vitest'
import {
  comparePracticeAnswer,
  normalizePracticeText,
  practiceSentences,
} from './practice'

describe('practice helpers', () => {
  it('normalizes case, punctuation, quotes and whitespace', () => {
    expect(normalizePracticeText('  “World”   Heritage! ')).toBe(
      "'world' heritage",
    )
  })

  it('scores matching words and reports important vocabulary', () => {
    const result = comparePracticeAnswer(
      'The ancient monument protects biodiversity',
      'The ancient monument protects exceptional biodiversity.',
    )
    expect(result.score).toBeGreaterThan(70)
    expect(result.keywords).toContain('biodiversity')
    expect(result.matchedKeywords).toContain('biodiversity')
  })

  it('selects sentences with a practical exercise length', () => {
    expect(
      practiceSentences(
        'Too short. This sentence contains enough useful words for a listening exercise.',
      ),
    ).toEqual([
      'This sentence contains enough useful words for a listening exercise.',
    ])
  })
})
