import { registerSW } from 'virtual:pwa-register'
import { toast } from 'sonner'

// O service worker serve o index.html e o JS do cache, inclusive no navegador
// do desktop. Sem isto, depois de um deploy a aba seguia na versão antiga até
// um Ctrl+F5. Aqui a versão nova fica esperando e o usuário decide quando
// trocar — um reload automático no meio do treino perderia o que o aluno
// estava registrando.
const INTERVALO_VERIFICACAO = 60 * 60 * 1000

export function registrarServiceWorker() {
  const atualizar = registerSW({
    onNeedRefresh() {
      toast('Nova versão disponível', {
        id: 'nova-versao',
        duration: Infinity,
        action: { label: 'Atualizar', onClick: () => atualizar(true) },
      })
    },
    onRegisteredSW(_swUrl, registro) {
      if (!registro) return
      // Sem isto o navegador só procura versão nova quando a página carrega,
      // e uma aba (ou o PWA) aberta o dia todo nunca ficaria sabendo do deploy.
      const verificar = () => {
        if (!navigator.onLine || registro.installing) return
        registro.update().catch(() => {})
      }
      setInterval(verificar, INTERVALO_VERIFICACAO)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') verificar()
      })
    },
  })
}
