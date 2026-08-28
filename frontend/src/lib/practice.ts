export type WordComparison = {
  word: string
  status: 'correct' | 'missing' | 'extra'
}

export function practiceSentences(text: string) {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 25 && sentence.length <= 240)
}

export function normalizePracticeText(text: string) {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[“”‘’]/g, "'")
    .replace(/[^a-z0-9'\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function comparePracticeAnswer(answer: string, expected: string) {
  const actualWords = normalizePracticeText(answer).split(' ').filter(Boolean)
  const expectedWords = normalizePracticeText(expected)
    .split(' ')
    .filter(Boolean)
  const matrix = Array.from({ length: expectedWords.length + 1 }, () =>
    Array<number>(actualWords.length + 1).fill(0),
  )
  for (let i = 1; i <= expectedWords.length; i += 1) {
    for (let j = 1; j <= actualWords.length; j += 1) {
      matrix[i][j] =
        expectedWords[i - 1] === actualWords[j - 1]
          ? matrix[i - 1][j - 1] + 1
          : Math.max(matrix[i - 1][j], matrix[i][j - 1])
    }
  }
  const correct = matrix[expectedWords.length][actualWords.length]
  const denominator = Math.max(expectedWords.length, actualWords.length, 1)
  const score = Math.round((correct / denominator) * 100)
  const importantWords = expectedWords.filter(
    (word) => word.length >= 6 && !commonWords.has(word),
  )
  const keywords = [...new Set(importantWords)].slice(0, 8)
  return {
    score,
    expectedWords,
    actualWords,
    matchedKeywords: keywords.filter((word) => actualWords.includes(word)),
    keywords,
    comparison: expectedWords.map<WordComparison>((word, index) => ({
      word,
      status: actualWords[index] === word ? 'correct' : 'missing',
    })),
  }
}

const commonWords = new Set([
  'about',
  'after',
  'before',
  'between',
  'during',
  'which',
  'their',
  'there',
  'these',
  'those',
  'through',
])
