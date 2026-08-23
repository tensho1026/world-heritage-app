export type HeritageCategory = 'Cultural' | 'Natural' | 'Mixed'
export type HeritageMode = 'all' | 'famous'
export type ComprehensionLevel = 'difficult' | 'partial' | 'understood'

export type WorldHeritageSite = {
  uuid: string
  unescoId: string
  nameEn: string
  shortDescriptionEn: string | null
  descriptionEn: string | null
  justificationEn: string | null
  dateInscribed: number | null
  danger: boolean
  dangerList: string | null
  areaHectares: number | null
  culturalCriteria: string[]
  naturalCriteria: string[]
  criteriaText: string | null
  category: HeritageCategory
  statesNames: string[]
  isoCodes: string[]
  region: string | null
  latitude: number | null
  longitude: number | null
  mainImageUrl: string | null
  mainImageAuthor: string | null
  mainImageCopyright: string | null
  mainImageCaptionEn: string | null
  mainImageSourceUrl: string | null
  mainImageLicense: string | null
  imageUrls: string[]
  mainVideoUrl: string | null
  mainVideoAuthor: string | null
  mainVideoCaptionEn: string | null
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
  createdAt: string
  updatedAt: string
  sources: VocabularySource[]
}
