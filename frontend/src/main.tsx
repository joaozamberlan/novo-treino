import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// O Safari do iOS só aplica :active num toque se houver um listener de touch
// na árvore. Sem isso o feedback de pressão (scale nos botões) só aparecia no
// clique do mouse; com ele, aparece no instante em que o dedo encosta.
document.addEventListener('touchstart', () => {}, { passive: true })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
