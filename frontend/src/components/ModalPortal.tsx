import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const FOCAVEIS =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Modais abertos ao mesmo tempo (ex.: confirmação por cima de um formulário):
// a rolagem do fundo só volta quando o último fecha.
let abertos = 0;

// Portal no body: as páginas ficam dentro de um .animate-in (animação de
// opacidade com forwards), que cria um contexto de empilhamento e prendia o
// modal abaixo da barra de abas e do cabeçalho, com os botões escondidos atrás.
//
// Também cuida do que todo modal precisa e nenhum fazia sozinho: trava a
// rolagem do fundo, leva o foco para dentro, prende o Tab, fecha no Esc e
// devolve o foco a quem abriu.
export function ModalPortal({ children }: { children: ReactNode }) {
  const raizRef = useRef<HTMLDivElement>(null);
  // Quem tinha o foco antes de abrir. Fica numa ref para sobreviver à
  // remontagem dos efeitos que o React faz em desenvolvimento.
  const quemAbriuRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const raiz = raizRef.current;
    if (!quemAbriuRef.current) quemAbriuRef.current = document.activeElement as HTMLElement | null;
    const quemAbriu = quemAbriuRef.current;

    if (abertos === 0) {
      // Sem a barra de rolagem a página alargaria alguns pixels; a folga compensa
      const barra = window.innerWidth - document.documentElement.clientWidth;
      if (barra > 0) document.body.style.paddingRight = `${barra}px`;
      document.body.classList.add('modal-aberto');
    }
    abertos += 1;

    // Um campo com autoFocus já puxou o foco. Sem ele, o foco vai para o
    // próprio diálogo, e não para o primeiro campo: no celular isso abriria o
    // teclado por cima de um modal que a pessoa ainda nem leu.
    if (raiz && !raiz.contains(document.activeElement)) {
      const dialogo = raiz.querySelector<HTMLElement>('[role="dialog"], [role="alertdialog"]') ?? (raiz.firstElementChild as HTMLElement | null);
      if (dialogo) {
        if (!dialogo.hasAttribute('tabindex')) dialogo.setAttribute('tabindex', '-1');
        dialogo.focus({ preventScroll: true });
      }
    }

    const noTeclado = (e: KeyboardEvent) => {
      if (!raiz) return;
      // Só o modal de cima responde ao teclado
      if (raiz.nextElementSibling?.hasAttribute('data-modal')) return;
      if (e.key === 'Escape') {
        // Quase toda página já fecha os seus modais no Esc. Para os que não
        // fecham, vale o mesmo que tocar fora: se o modal continuar aberto
        // depois que a página tratou a tecla, clica no fundo.
        window.setTimeout(() => {
          if (raiz.isConnected) raiz.querySelector<HTMLElement>('.modal-backdrop')?.click();
        }, 0);
        return;
      }
      if (e.key !== 'Tab') return;
      const itens = [...raiz.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((el) => el.getClientRects().length > 0);
      if (itens.length === 0) {
        e.preventDefault();
        return;
      }
      const primeiro = itens[0];
      const ultimo = itens[itens.length - 1];
      const atual = document.activeElement as HTMLElement | null;
      if (!atual || !raiz.contains(atual)) {
        e.preventDefault();
        primeiro.focus();
      } else if (e.shiftKey && (atual === primeiro || !itens.includes(atual))) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && atual === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };
    document.addEventListener('keydown', noTeclado);

    return () => {
      document.removeEventListener('keydown', noTeclado);
      abertos -= 1;
      if (abertos === 0) {
        document.body.classList.remove('modal-aberto');
        document.body.style.paddingRight = '';
      }
      // Só depois de o modal sair de fato da tela: em desenvolvimento o React
      // desmonta e remonta os efeitos na abertura, e devolver o foco nessa
      // hora o tirava de dentro do modal recém-aberto.
      window.setTimeout(() => {
        if (!raiz?.isConnected && quemAbriu?.isConnected) quemAbriu.focus({ preventScroll: true });
      }, 0);
    };
  }, []);

  return createPortal(
    <div ref={raizRef} data-modal="" style={{ display: 'contents' }}>
      {children}
    </div>,
    document.body,
  );
}
