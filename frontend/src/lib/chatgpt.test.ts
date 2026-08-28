import { describe, expect, it } from 'vitest'
import type { WorldHeritageSite } from '../types'
import {
  buildChatGptTranslationPrompt,
  buildChatGptTranslationUrl,
} from './chatgpt'

const site = {
  nameEn: 'Test Heritage Site',
  statesNames: ['Example State'],
  shortDescriptionEn: 'A short English description.',
  descriptionEn: 'The complete English article.',
  justificationEn: 'It has outstanding universal value.',
  culturalCriteria: ['c1'],
  naturalCriteria: [],
  criteriaText: 'Criterion details.',
} as unknown as WorldHeritageSite

describe('ChatGPT translation prompt', () => {
  it('includes every article section and asks for Japanese translation', () => {
    const prompt = buildChatGptTranslationPrompt(site)

    expect(prompt).toContain('全文翻訳')
    expect(prompt).toContain('Test Heritage Site')
    expect(prompt).toContain('A short English description.')
    expect(prompt).toContain('The complete English article.')
    expect(prompt).toContain('It has outstanding universal value.')
    expect(prompt).toContain('Criterion details.')
  })

  it('builds a ChatGPT URL with the encoded prompt', () => {
    const url = new URL(buildChatGptTranslationUrl(site))

    expect(url.origin).toBe('https://chatgpt.com')
    expect(url.searchParams.get('prompt')).toBe(
      buildChatGptTranslationPrompt(site),
    )
  })
})
