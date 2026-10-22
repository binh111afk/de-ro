import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
// Be Vietnam Pro — có đủ subset tiếng Việt (latin + latin-ext + vietnamese).
import '@fontsource/be-vietnam-pro/400.css'
import '@fontsource/be-vietnam-pro/500.css'
import '@fontsource/be-vietnam-pro/600.css'
import '@fontsource/be-vietnam-pro/700.css'
import '@fontsource-variable/jetbrains-mono'

// Static hosts that do not rewrite unknown paths to index.html land on
// 404.html, which sends the original route back here as ?__redirect=.
const redirect = new URLSearchParams(window.location.search).get('__redirect')
if (redirect) {
  window.history.replaceState(null, '', redirect)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
