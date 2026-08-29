import type {
  DiscoveryFilterOptions,
  DiscoveryFilters,
  DiscoverySearchPage,
  DiscoverySite,
  HeritageMapProgress,
  HeritageTimelineItem,
  HeritageTheme,
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
  const { data } = await apiClient.get<DiscoverySite[]>('/discovery/map', {
    params: params(filters),
  })
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

export async function getTimeline(filters: DiscoveryFilters) {
  const { data } = await apiClient.get<HeritageTimelineItem[]>(
    '/discovery/timeline',
    { params: params(filters) },
  )
  return data
}
