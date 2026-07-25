import { Route, Routes } from 'react-router-dom'

import RandomHeritagePage from './pages/RandomHeritagePage'
import HomePage from './pages/HomePage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/random-heritage" element={<RandomHeritagePage />} />
    </Routes>
  )
}

export default App
