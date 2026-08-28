import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'

import RandomHeritagePage from './pages/RandomHeritagePage'
import HomePage from './pages/HomePage'
import VocabularyPage from './pages/VocabularyPage'
import MemorizePage from './pages/MemorizePage'
import CollectionPage from './pages/CollectionPage'
import StatsPage from './pages/StatsPage'
import ExplorePage from './pages/ExplorePage'
import ThemesPage from './pages/ThemesPage'
import TimelinePage from './pages/TimelinePage'
import ChallengesPage from './pages/ChallengesPage'

const MapPage = lazy(() => import('./pages/MapPage'))

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/random-heritage" element={<RandomHeritagePage />} />
      <Route path="/heritage/:id" element={<RandomHeritagePage />} />
      <Route path="/vocabulary" element={<VocabularyPage />} />
      <Route path="/memorize" element={<MemorizePage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/themes" element={<ThemesPage />} />
      <Route path="/timeline" element={<TimelinePage />} />
      <Route path="/challenges" element={<ChallengesPage />} />
      <Route
        path="/map"
        element={
          <Suspense
            fallback={
              <div className="grid min-h-screen place-items-center bg-[#fbf8f1] text-sm text-[#18352f]">
                世界地図を準備しています…
              </div>
            }
          >
            <MapPage />
          </Suspense>
        }
      />
      <Route path="/favorites" element={<CollectionPage kind="favorites" />} />
      <Route
        path="/read-later"
        element={<CollectionPage kind="read-later" />}
      />
    </Routes>
  )
}

export default App
