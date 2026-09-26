import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';

// Portal no body: as páginas ficam dentro de um .animate-in (animação de
// opacidade com forwards), que cria um contexto de empilhamento e prendia o
// modal abaixo da barra de abas e do cabeçalho, com os botões escondidos atrás.
export function ModalPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.body);
}
