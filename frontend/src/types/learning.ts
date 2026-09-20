import type { ComprehensionLevel, HeritageCategory } from './heritage'

export type QuizQuestion = {
  id: string
  type: 'multiple-choice' | 'true-false'
  prompt: string
  options: string[]
  evidence: string
}

export type HeritageQuiz = {
  heritageSiteId: string
  title: string
  questions: QuizQuestion[]
}

export type QuizResult = {
  questionId: string
  answer: string
  correct: boolean
  correctAnswer: string
  evidence: string
}

export type QuizAttemptResult = {
  id: number
  heritageSiteId: string
  score: number
  total: number
  completedAt: string
  results: QuizResult[]
}

export type CalendarDay = {
  reads: number
  savedVocabulary: number
  reviews: number
  total: number
}

export type LearningCalendar = {
  month: string
  days: Record<string, CalendarDay>
  activeDays: number
  currentStreak: number
}

export type WeeklyReport = {
  generatedAt: string
  periodStart: string
  periodEnd: string
  readSites: Array<{
    heritageSiteId: string
    nameEn: string
    count: number
  }>
  newVocabulary: Array<{
    id: number
    expression: string
    translationJa: string
  }>
  difficultVocabulary: Array<{
    id: number
    expression: string
    translationJa: string
    difficultReviews: number
    totalLapses: number
  }>
  comprehensionChanges: Array<{
    id: number
    heritageSiteId: string
    heritageNameEn: string
    previousLevel: ComprehensionLevel | null
    nextLevel: ComprehensionLevel | null
    changedAt: string
  }>
  nextWeekReviewCount: number
  reviewCount: number
  quizAttempts: number
  quizAccuracy: number | null
}

export type ChallengeMetric =
  | 'unique_sites'
  | 'new_countries'
  | 'filtered_reads'
  | 'vocabulary_saved'
  | 'vocabulary_reviews'
  | 'quiz_attempts'
  | 'dictation_attempts'
  | 'writing_attempts'

export type ChallengeFilters = {
  country?: string
  region?: string
  category?: HeritageCategory | ''
  theme?: string
}

export type MonthlyChallengeInput = {
  name: string
  month: string
  metric: ChallengeMetric
  target: number
  filters: ChallengeFilters
  note: string
}

export type MonthlyChallenge = MonthlyChallengeInput & {
  id: number
  progress: number
  percentage: number
  completed: boolean
  status: 'upcoming' | 'active' | 'ended'
  createdAt: string
  updatedAt: string
}
