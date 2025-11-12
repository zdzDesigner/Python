import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { NotificationProvider } from './utils/NotificationContext.jsx'
import { AudioLibraryProvider } from './context/AudioLibraryContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <NotificationProvider>
      <AudioLibraryProvider>
        <App />
      </AudioLibraryProvider>
    </NotificationProvider>
  </StrictMode>,
)
