import { queryKeys } from '../api/queryKeys'
import { useQuery } from '@tanstack/react-query'
import { getRandomHeritage } from '../api/random-heritage'

export function useRandomHeritage() {
  return useQuery({
    queryKey: queryKeys.randomHeritage,
    queryFn: getRandomHeritage,
  })
}
