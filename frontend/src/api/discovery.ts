import type {
  DiscoveryFilterOptions,
  DiscoveryFilters,
  DiscoverySearchPage,
  DiscoverySite,
  HeritageMapProgress,
  HeritageProgressItem,
  HeritageTimelineItem,
  HeritageTheme,
  MapSiteDetails,
  MapSiteMarker,
} from '../types'
import { apiClient } from './client'

function params(filters: DiscoveryFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value !== '' && value !== false,
    ),
  )
}

export async function searchHeritage(
  filters: DiscoveryFilters,
  page = 1,
  pageSize = 24,
) {
  const { data } = await apiClient.get<DiscoverySearchPage>(
    '/discovery/sites',
    {
      params: { ...params(filters), page, pageSize },
    },
  )
  return data
}

export async function getMapHeritage(filters: DiscoveryFilters) {
  const { data } = await apiClient.get<MapSiteMarker[]>('/discovery/map', {
    params: params(filters),
  })
  return data
}

export async function getMapSite(id: string) {
  const { data } = await apiClient.get<MapSiteDetails>(`/discovery/map/${id}`)
  return data
}

export async function getDiscoveryFilters() {
  const { data } =
    await apiClient.get<DiscoveryFilterOptions>('/discovery/filters')
  return data
}

export async function getThemes() {
  const { data } = await apiClient.get<HeritageTheme[]>('/discovery/themes')
  return data
}

export async function getRandomDiscoverySite(filters: DiscoveryFilters) {
  const { data } = await apiClient.get<DiscoverySite | null>(
    '/discovery/random',
    { params: params(filters) },
  )
  return data
}

export async function getMapProgress() {
  const { data } = await apiClient.get<HeritageMapProgress>(
    '/discovery/progress',
  )
  return data
}

export async function getCountryProgress(isoCode: string) {
  const { data } = await apiClient.get<HeritageProgressItem>(
    `/discovery/progress/country/${encodeURIComponent(isoCode)}`,
  )
  return data
}

export async function getTimeline(filters: DiscoveryFilters) {
  const { data } = await apiClient.get<HeritageTimelineItem[]>(
    '/discovery/timeline',
    { params: params(filters) },
  )
  return data
}
