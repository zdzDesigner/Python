import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AudioBook } from './pages/book/Book'
import { AudioSection } from './pages/section/Section'
import { DubbingList } from './pages/dubbing/Dubbing'

const App = () => {
  return (
    <Routes>
      {/* Default route - redirect to audiobook/list */}
      {
        <Route path="/" element={<Navigate to="/audiobook/list" replace />} />
        // <Route path="/" element={<Navigate to="/dubbing/list" replace />} />
        // <Route path="/" element={<Navigate to="/audiobook/1/section/2" replace />} />
      }

      {/* audiobook/list route */}
      <Route path="/audiobook/list" element={<AudioBook />} />

      {/* audiobook/section route */}
      <Route path="/audiobook/:book_id/section/:section_id" element={<AudioSection />} />

      {/* dubbing/list route */}
      <Route path="/dubbing/list" element={<DubbingList />} />
    </Routes>
  )
}

export default App
