import type { WorldHeritageSite } from '../types'

export function buildChatGptTranslationPrompt(site: WorldHeritageSite) {
  const criteria = [...site.culturalCriteria, ...site.naturalCriteria]
    .map((criterion) => criterion.replace(/^[cn]/, ''))
    .join(', ')
  const sections = [
    `World Heritage Site: ${site.nameEn}`,
    site.statesNames.length
      ? `Country/State: ${site.statesNames.join(', ')}`
      : '',
    site.shortDescriptionEn
      ? `\nShort description:\n${site.shortDescriptionEn}`
      : '',
    site.descriptionEn ? `\nDescription:\n${site.descriptionEn}` : '',
    site.justificationEn
      ? `\nJustification for inscription:\n${site.justificationEn}`
      : '',
    criteria ? `\nCriteria: ${criteria}` : '',
    site.criteriaText ? `\nCriteria details:\n${site.criteriaText}` : '',
  ].filter(Boolean)

  return [
    '以下はUNESCO世界遺産についての英語資料です。英語学習者向けに、内容を省略せず自然な日本語へ全文翻訳してください。',
    '固有名詞には必要に応じて英語表記を添え、世界遺産の文脈に合う訳語を使ってください。',
    '出力は「世界遺産名」「全文翻訳」「重要な英単語・句動詞（最大10件）」の順に整理してください。',
    '追加の事実を創作せず、与えられた英文の内容に基づいてください。',
    '',
    sections.join('\n'),
  ].join('\n')
}

export function buildChatGptTranslationUrl(site: WorldHeritageSite) {
  return `https://chatgpt.com/?prompt=${encodeURIComponent(buildChatGptTranslationPrompt(site))}`
}
