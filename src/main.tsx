import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Tras un nuevo deploy, una pestaña abierta con la versión anterior pide chunks
// (p. ej. el SDK de Stellar) que ya no existen. Recargamos una vez para traer la
// versión nueva en lugar de mostrar "Failed to fetch dynamically imported module".
window.addEventListener('vite:preloadError', (event) => {
  const key = 'build-bond:reloaded-after-deploy'
  try {
    if (sessionStorage.getItem(key)) return
    sessionStorage.setItem(key, '1')
  } catch {
    return
  }
  event.preventDefault()
  window.location.reload()
})
window.addEventListener('load', () => {
  window.setTimeout(() => {
    try {
      sessionStorage.removeItem('build-bond:reloaded-after-deploy')
    } catch {
      // sin almacenamiento disponible: no hay nada que limpiar
    }
  }, 10_000)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
