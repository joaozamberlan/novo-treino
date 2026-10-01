import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import alunoApi, { setOnAlunoUnauthorized } from '../services/alunoApi';
import { ALUNO_CONTA_KEY, ALUNO_TOKEN_KEY, PERFIL_KEY } from '../constants/storageKeys';

export interface ContaAluno {
  aluno: { idAluno: number; nome: string };
  profissional: { idProfissional: number; nome: string; logoUrl?: string | null };
}

// O que /aluno/auth/login e /primeiro-acesso devolvem por cadastro de aluno
export interface ContaComToken extends ContaAluno {
  accessToken: string;
}

interface AlunoAuthContextData {
  conta: ContaAluno | null;
  // Telefone + PIN. Devolve uma conta por treinador em que os dois batem; quem
  // chama escolhe uma e passa para `entrar`.
  login(telefone: string, pin: string): Promise<ContaComToken[]>;
  // Primeiro acesso pelo link: cria o PIN e já entra. Devolve o protocolo do link.
  primeiroAcesso(token: string, telefone: string, pin: string): Promise<number | null>;
  entrar(conta: ContaComToken): void;
  sair(): void;
  // GET /aluno/me devolve um token novo quando o atual está perto de vencer
  renovarToken(accessToken: string): void;
}

const AlunoAuthContext = createContext<AlunoAuthContextData>({} as AlunoAuthContextData);

function lerContaSalva(): ContaAluno | null {
  try {
    const salva = localStorage.getItem(ALUNO_CONTA_KEY);
    return salva && localStorage.getItem(ALUNO_TOKEN_KEY) ? JSON.parse(salva) : null;
  } catch {
    return null;
  }
}

export const AlunoAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [conta, setConta] = useState<ContaAluno | null>(lerContaSalva);

  const entrar = useCallback(({ accessToken, aluno, profissional }: ContaComToken) => {
    const nova = { aluno, profissional };
    localStorage.setItem(ALUNO_TOKEN_KEY, accessToken);
    localStorage.setItem(ALUNO_CONTA_KEY, JSON.stringify(nova));
    localStorage.setItem(PERFIL_KEY, 'aluno');
    setConta(nova);
  }, []);

  const sair = useCallback(() => {
    localStorage.removeItem(ALUNO_TOKEN_KEY);
    localStorage.removeItem(ALUNO_CONTA_KEY);
    setConta(null);
  }, []);

  const login = useCallback(async (telefone: string, pin: string) => {
    const res = await alunoApi.post('/aluno/auth/login', { telefone, pin });
    return res.data.contas as ContaComToken[];
  }, []);

  const primeiroAcesso = useCallback(
    async (token: string, telefone: string, pin: string) => {
      const res = await alunoApi.post('/aluno/auth/primeiro-acesso', { token, telefone, pin });
      entrar(res.data);
      return (res.data.idProtocolo as number | null) ?? null;
    },
    [entrar],
  );

  const renovarToken = useCallback((accessToken: string) => {
    localStorage.setItem(ALUNO_TOKEN_KEY, accessToken);
  }, []);

  // PIN redefinido, acesso revogado ou sessão vencida: o servidor responde 401
  // e o app volta para o login em vez de ficar com todas as chamadas falhando.
  useEffect(() => {
    setOnAlunoUnauthorized((mensagem) => {
      if (!localStorage.getItem(ALUNO_TOKEN_KEY)) return;
      sair();
      toast.error(mensagem || 'Seu acesso foi atualizado. Entre de novo.', { id: 'sessao-aluno' });
    });
    return () => setOnAlunoUnauthorized(null);
  }, [sair]);

  return (
    <AlunoAuthContext.Provider value={{ conta, login, primeiroAcesso, entrar, sair, renovarToken }}>
      {children}
    </AlunoAuthContext.Provider>
  );
};

export const useAlunoAuth = () => useContext(AlunoAuthContext);
