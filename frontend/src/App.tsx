import { Route, Routes } from 'react-router-dom'

import RandomHeritagePage from './pages/RandomHeritagePage'
import HomePage from './pages/HomePage'
import VocabularyPage from './pages/VocabularyPage'
import MemorizePage from './pages/MemorizePage'
import CollectionPage from './pages/CollectionPage'
import StatsPage from './pages/StatsPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/random-heritage" element={<RandomHeritagePage />} />
      <Route path="/heritage/:id" element={<RandomHeritagePage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />
      <Route path="/memorize" element={<MemorizePage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/favorites" element={<CollectionPage kind="favorites" />} />
      <Route
        path="/read-later"
        element={<CollectionPage kind="read-later" />}
      />
    </Routes>
  )
}

export default App
