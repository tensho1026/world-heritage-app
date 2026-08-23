import { describe, expect, it } from 'vitest'
import { simplifyEnglish } from './simplify-english'

describe('simplifyEnglish', () => {
  it('keeps the original text unchanged', () => {
    expect(simplifyEnglish('It comprises many sites.', 'original')).toBe(
      'It comprises many sites.',
    )
  })

  it('uses simpler vocabulary for learning views', () => {
    expect(
      simplifyEnglish(
        'It comprises numerous significant monuments; it demonstrates history.',
        'B1',
      ),
    ).toBe('It includes many important monuments. it shows history.')
  })
})
