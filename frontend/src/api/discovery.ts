import type {
  DiscoveryFilterOptions,
  DiscoveryFilters,
  DiscoverySite,
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

export async function searchHeritage(filters: DiscoveryFilters) {
  const { data } = await apiClient.get<DiscoverySite[]>('/discovery/sites', {
    params: params(filters),
  })
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
