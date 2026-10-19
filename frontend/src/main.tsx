import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from '@phosphor-icons/react'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import App from './App.tsx'
import { registrarServiceWorker } from './pwa'

// O Safari do iOS só aplica :active num toque se houver um listener de touch
// na árvore. Sem isso o feedback de pressão (scale nos botões) só aparecia no
// clique do mouse; com ele, aparece no instante em que o dedo encosta.
document.addEventListener('touchstart', () => {}, { passive: true })

registrarServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* Bold do Phosphor tem o peso do traço 2px de antes; duotone só em destaque */}
    <IconContext.Provider value={{ weight: 'bold' }}>
      <App />
    </IconContext.Provider>
  </StrictMode>,
)
