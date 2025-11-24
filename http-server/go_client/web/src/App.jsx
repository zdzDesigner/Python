import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AudioBook } from './pages/Book'
import { AudioSection } from './pages/Section'
import { DubbingList } from './pages/Dubbing'

const App = () => {
  return (
    <Routes>
      {/* Default route - redirect to audiobook/list */}
      {
        // <Route path="/" element={<Navigate to="/audiobook/list" replace />} />
        // <Route path="/" element={<Navigate to="/dubbing/list" replace />} />
        <Route path="/" element={<Navigate to="/audiobook/section" replace />} />
      }

      {/* audiobook/list route */}
      <Route path="/audiobook/list" element={<AudioBook />} />

      {/* audiobook/section route */}
      <Route path="/audiobook/section" element={<AudioSection />} />

      {/* dubbing/list route */}
      <Route path="/dubbing/list" element={<DubbingList />} />
    </Routes>
  )
}

export default App
