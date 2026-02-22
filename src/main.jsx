import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { RouterProvider } from 'react-router-dom'
import './index.css'
import { store } from './app/store'
import { AuthProvider } from './features/auth/AuthProvider'
import router from './routes/router'

const restoreGithubPagesRedirect = () => {
  const url = new URL(window.location.href)
  const redirect = url.searchParams.get('__redirect')
  if (!redirect) return

  url.searchParams.delete('__redirect')
  const remainingSearch = url.searchParams.toString()
  const normalizedBase = import.meta.env.BASE_URL.endsWith('/')
    ? import.meta.env.BASE_URL.slice(0, -1)
    : import.meta.env.BASE_URL
  let normalizedRedirect = redirect.startsWith('/') ? redirect : `/${redirect}`
  if (normalizedBase && (normalizedRedirect === normalizedBase || normalizedRedirect.startsWith(`${normalizedBase}/`))) {
    normalizedRedirect = normalizedRedirect.slice(normalizedBase.length) || '/'
  }
  const targetUrl = `${normalizedBase}${normalizedRedirect}`
  const finalUrl = remainingSearch ? `${targetUrl}${targetUrl.includes('?') ? '&' : '?'}${remainingSearch}` : targetUrl

  window.history.replaceState(null, '', finalUrl)
}

restoreGithubPagesRedirect()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </Provider>
  </StrictMode>
)
