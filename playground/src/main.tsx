import './shims/buffer'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loader } from '@monaco-editor/react'
import './index.css'
import { initAlpLanguage } from './monaco/alp-language'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'

initAlpLanguage()

loader.config({
  paths: {
    vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs',
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
