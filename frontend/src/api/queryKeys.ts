import type { DiscoveryFilters, HeritageMode } from '../types'
import type { MapViewport } from './discovery'

export const queryKeys = {
  stats: ['stats'] as const,
  history: {
    all: ['history'] as const,
    page: (...parts: readonly unknown[]) => ['history', ...parts] as const,
  },
  collections: {
    all: (kind: string) => [kind] as const,
    page: (kind: string, page: number) => [kind, page] as const,
  },
  heritage: {
    detail: (id: string | undefined) => ['heritage', id] as const,
    random: (mode: HeritageMode, sequence: number) =>
      ['heritage', 'random', mode, sequence] as const,
    learning: (id: string | undefined) => ['learning-state', id] as const,
  },
  translations: {
    deepl: (id: string | undefined) =>
      ['article-translation', 'deepl', id] as const,
  },
  highlights: (id: string | undefined) => ['highlights', id] as const,
  vocabulary: {
    all: ['vocabulary'] as const,
    list: (...parts: readonly unknown[]) => ['vocabulary', ...parts] as const,
  },
  reviews: { summary: ['review-summary'] as const },
  discovery: {
    filters: ['discovery-filters'] as const,
    sites: (filters: DiscoveryFilters, page: number) =>
      ['discovery-sites', filters, page] as const,
    mapSites: (filters: DiscoveryFilters, viewport: MapViewport | null) =>
      ['map-sites', filters, viewport] as const,
    mapSite: (id: string | null) => ['map-site', id] as const,
    progress: ['heritage-map-progress'] as const,
    countryProgress: (isoCode: string) =>
      ['heritage-map-country-progress', isoCode] as const,
    timeline: (filters: DiscoveryFilters) =>
      ['heritage-timeline', filters] as const,
  },
  themes: ['themes'] as const,
  challenges: {
    all: ['monthly-challenges'] as const,
    month: (month: string) => ['monthly-challenges', month] as const,
  },
  calendar: (month: string) => ['learning-calendar', month] as const,
  weeklyReport: ['weekly-report'] as const,
  quiz: (heritageSiteId: string) => ['quiz', heritageSiteId] as const,
  randomHeritage: ['random-heritage'] as const,
}
