import { useQuery } from '@tanstack/react-query'
import { getRandomHeritage } from '../api/random-heritage'

export function useRandomHeritage() {
  return useQuery({
    queryKey: ['random-heritage'],
    queryFn: getRandomHeritage,
  })
}
