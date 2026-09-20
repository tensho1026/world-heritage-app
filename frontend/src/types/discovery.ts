import type { ComprehensionLevel, HeritageCategory } from './heritage'

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
