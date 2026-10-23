import type { MouseEvent } from 'react';

// Fundo de modal de formulário: clique ou toque fora não fecha, para um
// toque sem querer (ou soltar o mouse fora ao selecionar texto num campo)
// não apagar o que foi digitado. Fecham o X, o Cancelar e o Esc; o Esc chega
// aqui como o clique simulado do ModalPortal, que tem detail 0.
export const fecharSoPeloTeclado = (fechar: () => void) => (e: MouseEvent) => {
  if (e.detail === 0) fechar();
};
