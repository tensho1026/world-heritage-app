import { Route, Routes } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const HomePage = lazy(() => import('./pages/HomePage'))
const RandomHeritagePage = lazy(() => import('./pages/RandomHeritagePage'))
const VocabularyPage = lazy(() => import('./pages/VocabularyPage'))
const MemorizePage = lazy(() => import('./pages/MemorizePage'))
const CollectionPage = lazy(() => import('./pages/CollectionPage'))
const StatsPage = lazy(() => import('./pages/StatsPage'))
const ExplorePage = lazy(() => import('./pages/ExplorePage'))
const ThemesPage = lazy(() => import('./pages/ThemesPage'))
const TimelinePage = lazy(() => import('./pages/TimelinePage'))
const ChallengesPage = lazy(() => import('./pages/ChallengesPage'))
const MapPage = lazy(() => import('./pages/MapPage'))

function App() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-screen place-items-center bg-[#fbf8f1] text-sm text-[#18352f]">
          画面を準備しています…
        </div>
      }
    >
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
        <Route path="/map" element={<MapPage />} />
        <Route
          path="/favorites"
          element={<CollectionPage kind="favorites" />}
        />
        <Route
          path="/read-later"
          element={<CollectionPage kind="read-later" />}
        />
      </Routes>
    </Suspense>
  )
}

export default App
