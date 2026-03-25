import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './contexts/ThemeContext.jsx'
import { UploadProvider } from './contexts/UploadContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <UploadProvider>
        <App />
      </UploadProvider>
    </ThemeProvider>
  </StrictMode>,
)
