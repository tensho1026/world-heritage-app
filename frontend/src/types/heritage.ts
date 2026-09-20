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

export type PaginatedPage<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNextPage: boolean
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
