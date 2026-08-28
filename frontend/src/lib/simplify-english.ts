export type ReadingLevel = 'original' | 'B1' | 'A2'

const b1Replacements: Array<[RegExp, string]> = [
  [/\bapproximately\b/gi, 'about'],
  [/\bnumerous\b/gi, 'many'],
  [/\bsignificant\b/gi, 'important'],
  [/\bdemonstrates\b/gi, 'shows'],
  [/\billustrates\b/gi, 'shows'],
  [/\bcomprises\b/gi, 'includes'],
  [/\bconstitutes\b/gi, 'is'],
  [/\bpreserves\b/gi, 'keeps'],
  [/\bdesignated\b/gi, 'named'],
]

const a2Replacements: Array<[RegExp, string]> = [
  ...b1Replacements,
  [/\binscribed\b/gi, 'added'],
  [/\blocated\b/gi, 'found'],
  [/\bestablished\b/gi, 'started'],
  [/\bcontains\b/gi, 'has'],
  [/\binhabitants\b/gi, 'people'],
  [/\bexceptional\b/gi, 'very special'],
  [/\bunique\b/gi, 'special'],
  [/\bOutstanding Universal Value\b/g, 'great importance to the world'],
]

export function simplifyEnglish(text: string, level: ReadingLevel) {
  if (level === 'original') return text
  const replacements = level === 'B1' ? b1Replacements : a2Replacements
  let result = replacements.reduce(
    (current, [pattern, replacement]) => current.replace(pattern, replacement),
    text,
  )
  result = result.replace(/;\s*/g, '. ').replace(/:\s+(?=[A-Z])/g, '. ')
  if (level === 'A2') {
    result = result
      .replace(/,\s+and\s+(?=(?:it|they|this|these|the)\b)/gi, '. ')
      .replace(/\s{2,}/g, ' ')
  }
  result = result.replace(
    /(^|[.!?]\s+)([a-z])/g,
    (_, boundary: string, letter: string) =>
      `${boundary}${letter.toUpperCase()}`,
  )
  return result.trim()
}
