import axios from 'axios'

export async function getRandomHeritage() {
  const { data } = await axios.get('/api/random-heritage')
  return data
}
