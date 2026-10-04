import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { ModalPortal } from './ModalPortal';
import { ConfirmarContext, type OpcoesConfirmar } from '../contexts/confirmarContext';

interface Pedido extends OpcoesConfirmar {
  responder: (confirmou: boolean) => void;
}

// Diálogo de confirmação do app, no lugar do confirm() do navegador: segue o
// tema, diz o que se perde e nomeia o botão com a ação.
export const ConfirmarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);
  const confirmarRef = useRef<HTMLButtonElement>(null);
  const tituloId = useId();
  const mensagemId = useId();

  const confirmar = useCallback(
    (opcoes: OpcoesConfirmar) =>
      new Promise<boolean>((resolve) => {
        setPedido({ ...opcoes, responder: resolve });
      }),
    [],
  );

  const fechar = useCallback(
    (confirmou: boolean) => {
      pedido?.responder(confirmou);
      setPedido(null);
    },
    [pedido],
  );

  useEffect(() => {
    if (!pedido) return;
    // Em ação que apaga, um Enter distraído não pode confirmar
    (pedido.perigo ? cancelarRef : confirmarRef).current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // A página por trás também fecha modais no Esc: este é o de cima
      e.stopPropagation();
      fechar(false);
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [pedido, fechar]);

  return (
    <ConfirmarContext.Provider value={confirmar}>
      {children}
      {pedido && (
        <ModalPortal>
          <div
            className="modal-backdrop modal-backdrop--confirma"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            aria-describedby={pedido.mensagem ? mensagemId : undefined}
            onClick={() => fechar(false)}
          >
            <div className="modal-content confirma" onClick={(e) => e.stopPropagation()}>
              <h2 id={tituloId} className="confirma-titulo">
                {pedido.titulo}
              </h2>
              {pedido.mensagem && (
                <p id={mensagemId} className="confirma-mensagem">
                  {pedido.mensagem}
                </p>
              )}
              <div className="modal-footer confirma-acoes">
                <button ref={cancelarRef} type="button" className="btn btn-secondary" onClick={() => fechar(false)}>
                  {pedido.cancelar ?? 'Cancelar'}
                </button>
                <button ref={confirmarRef} type="button" className="btn btn-primary" onClick={() => fechar(true)}>
                  {pedido.confirmar}
                </button>
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
    </ConfirmarContext.Provider>
  );
};
