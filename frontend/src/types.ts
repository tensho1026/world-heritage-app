export type HeritageCategory = 'Cultural' | 'Natural' | 'Mixed'
export type HeritageMode = 'all' | 'famous'
export type ComprehensionLevel = 'difficult' | 'partial' | 'understood'

export type WorldHeritageSite = {
  uuid: string
  unescoId: string
  nameEn: string
  nameJa: string | null
  shortDescriptionEn: string | null
  shortDescriptionJa: string | null
  descriptionEn: string | null
  descriptionJa: string | null
  justificationEn: string | null
  justificationJa: string | null
  dateInscribed: number | null
  historicalPeriodStart?: number | null
  historicalPeriodEnd?: number | null
  historicalPeriodLabel?: string | null
  historicalPeriodType?: string | null
  historicalPeriodSourceUrl?: string | null
  historicalPeriodApproximate?: boolean
  historicalPeriodVerified?: boolean
  historicalPeriods?: Array<{
    start: number
    end: number | null
    label: string
    type: string
    sourceUrl: string
    approximate: boolean
    verified: boolean
  }>
  danger: boolean
  dangerList: string | null
  dangerListJa: string | null
  areaHectares: number | null
  culturalCriteria: string[]
  naturalCriteria: string[]
  criteriaText: string | null
  criteriaTextJa: string | null
  category: HeritageCategory
  statesNames: string[]
  statesNamesJa: string[]
  isoCodes: string[]
  region: string | null
  regionJa: string | null
  latitude: number | null
  longitude: number | null
  mainImageUrl: string | null
  mainImageAuthor: string | null
  mainImageCopyright: string | null
  mainImageCaptionEn: string | null
  mainImageCaptionJa: string | null
  mainImageSourceUrl: string | null
  mainImageLicense: string | null
  imageUrls: string[]
  mainVideoUrl: string | null
  mainVideoAuthor: string | null
  mainVideoCaptionEn: string | null
  mainVideoCaptionJa: string | null
  videoUrls: string[]
  componentsCount: number
  isFeatured: boolean
  wikipediaImageUrl: string | null
  wikipediaPageUrl: string | null
  wikipediaImageAuthor: string | null
  wikipediaImageLicense: string | null
}

export type SiteSummary = Pick<
  WorldHeritageSite,
  | 'uuid'
  | 'unescoId'
  | 'nameEn'
  | 'category'
  | 'statesNames'
  | 'region'
  | 'dateInscribed'
> & { mainImageUrl: string | null; updatedAt?: string }

export type LearningState = {
  heritageSiteId: string
  comprehensionLevel: ComprehensionLevel | null
  isFavorite: boolean
  isReadLater: boolean
  updatedAt?: string
  readCount?: number
}

export type HeritageStats = {
  totalViews: number
  totalReads: number
  uniqueViewed: number
  uniqueRead: number
  favorites: number
  readLater: number
  savedVocabulary: number
  memorizationVocabulary: number
  uncertainVocabulary: number
  comprehension: Record<ComprehensionLevel, number>
  byCategory: Record<string, number>
  byRegion: Record<string, number>
}

export type HistoryItem = {
  id: number
  heritageSiteId: string
  readAt: string
  site: SiteSummary
}

export type ArticleTranslation = Partial<
  Record<
    | 'nameEn'
    | 'shortDescriptionEn'
    | 'descriptionEn'
    | 'justificationEn'
    | 'criteriaText'
    | 'mainImageCaptionEn',
    string
  >
>

export type VocabularySource = {
  id: number
  heritageSiteId: string
  heritageNameEn: string
  sourceSentenceEn: string
  sectionType: string
  createdAt: string
}

export type SavedVocabulary = {
  id: number
  expression: string
  normalizedExpression: string
  translationJa: string
  isInMemorization: boolean
  isUncertain: boolean
  nextReviewAt: string
  reviewIntervalDays: number
  reviewEaseFactor: number
  reviewCount: number
  lapseCount: number
  lastReviewedAt: string | null
  createdAt: string
  updatedAt: string
  sources: VocabularySource[]
}

export type ReviewRating = 'again' | 'hard' | 'good'

export type ReviewSummary = {
  dueToday: number
  reviewedToday: number
  upcomingWeek: number
}

export type ArticleHighlight = {
  id: number
  heritageSiteId: string
  sectionKey: string
  startOffset: number
  endOffset: number
  selectedText: string
  noteJa: string
  difficultyReason: string | null
  reasonDetail: string
  createdAt: string
  updatedAt: string
}

export type DiscoverySite = {
  uuid: string
  nameEn: string
  shortDescriptionEn: string | null
  statesNames: string[]
  isoCodes: string[]
  region: string | null
  category: HeritageCategory
  dateInscribed: number | null
  latitude: number | null
  longitude: number | null
  isFeatured: boolean
  mainImageUrl: string | null
  comprehensionLevel: ComprehensionLevel | null
  isFavorite: boolean
  isReadLater: boolean
  readCount: number
}

export type MapSiteMarker = Pick<
  DiscoverySite,
  'uuid' | 'latitude' | 'longitude' | 'isFeatured' | 'readCount'
>

export type MapSiteDetails = Pick<
  DiscoverySite,
  | 'uuid'
  | 'nameEn'
  | 'statesNames'
  | 'category'
  | 'dateInscribed'
  | 'isFeatured'
  | 'isFavorite'
  | 'isReadLater'
  | 'readCount'
>

export type DiscoverySearchPage = {
  items: DiscoverySite[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type HeritageProgressItem = {
  name: string
  isoCode?: string
  total: number
  read: number
  percentage: number
  sites: Array<{ uuid: string; nameEn: string; read: boolean }>
}

export type HeritageMapProgress = {
  totalSites: number
  readSites: number
  totalCountries: number
  readCountries: number
  countries: HeritageProgressItem[]
  regions: HeritageProgressItem[]
}

export type HeritageTimelineItem = DiscoverySite & {
  historicalPeriods: Array<{
    start: number
    end: number | null
    label: string
    type: string
    sourceUrl: string
    approximate: boolean
    verified: boolean
  }>
}

export type DiscoveryFilters = {
  q?: string
  country?: string
  region?: string
  category?: HeritageCategory | ''
  year?: string
  featured?: boolean
  readStatus?: 'read' | 'unread' | ''
  favorite?: boolean
  comprehension?: ComprehensionLevel | ''
  theme?: string
}

export type DiscoveryFilterOptions = {
  regions: string[]
  countries: string[]
  years: number[]
  categories: HeritageCategory[]
  comprehensionLevels: ComprehensionLevel[]
}

export type HeritageTheme = {
  slug: string
  group: 'subject' | 'category' | 'region' | 'country' | 'status'
  nameJa: string
  nameEn: string
  descriptionJa: string
  count: number
  representativeUuid: string | null
  mainImageUrl: string | null
}

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
