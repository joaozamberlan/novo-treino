import { createContext, type ReactNode } from 'react';

export interface OpcoesConfirmar {
  // Pergunta curta, em uma linha (ex.: 'Excluir a ficha "Upper"?')
  titulo: string;
  // O que acontece ou se perde ao confirmar
  mensagem?: ReactNode;
  // Rótulo do botão que confirma: o verbo da ação, nunca "OK"
  confirmar: string;
  cancelar?: string;
  // Ação que apaga ou tira acesso: o foco começa em Cancelar
  perigo?: boolean;
}

export type Confirmar = (opcoes: OpcoesConfirmar) => Promise<boolean>;

export const ConfirmarContext = createContext<Confirmar>(() => Promise.resolve(false));
