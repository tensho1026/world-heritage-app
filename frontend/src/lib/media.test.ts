import { describe, expect, it } from 'vitest'
import { optimizedImageUrl } from './media'

describe('optimizedImageUrl', () => {
  it('uses a bounded WebP proxy for UNESCO document images', () => {
    const source = 'https://whc.unesco.org/document/203869'
    const result = new URL(optimizedImageUrl(source, 640)!)

    expect(result.origin).toBe('https://images.weserv.nl')
    expect(result.searchParams.get('url')).toBe(source)
    expect(result.searchParams.get('w')).toBe('640')
    expect(result.searchParams.get('q')).toBe('80')
    expect(result.searchParams.get('output')).toBe('webp')
  })

  it('keeps other image sources unchanged', () => {
    const source = 'https://upload.wikimedia.org/example.jpg'
    expect(optimizedImageUrl(source, 480)).toBe(source)
    expect(optimizedImageUrl(null, 480)).toBeNull()
  })
})
