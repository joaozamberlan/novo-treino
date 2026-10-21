import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { IconContext } from '@phosphor-icons/react'
import './index.css'
import App from './App.tsx'

// O Safari do iOS só aplica :active num toque se houver um listener de touch
// na árvore. Sem isso o feedback de pressão (scale nos botões) só aparecia no
// clique do mouse; com ele, aparece no instante em que o dedo encosta.
document.addEventListener('touchstart', () => {}, { passive: true })

// Peso bold: o regular do Phosphor tem traço 1,5px e some em ícone pequeno na
// academia; o bold fica perto da espessura que a interface já tinha.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <IconContext.Provider value={{ weight: 'bold' }}>
      <App />
    </IconContext.Provider>
  </StrictMode>,
)
