import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import api, { setOnUnauthorized } from '../services/api';
import { memoryCache } from '../services/cache';

interface Profissional {
  idProfissional: number;
  nome: string;
  email: string;
  cref: string;
  profissao: string;
  logoUrl?: string;
  telefone?: string;
  instagram?: string;
  rodapeTreino?: string | null;
  role: string;
}

interface AuthContextData {
  signed: boolean;
  user: Profissional | null;
  loading: boolean;
  login(email: string, senha: string): Promise<void>;
  register(data: {
    email: string;
    senha: string;
    nome: string;
    cref: string;
    profissao?: string;
    telefone?: string;
    instagram?: string;
  }): Promise<void>;
  logout(): void;
  updateUser(updatedUser: Partial<Profissional>): void;
  // Troca de senha invalida os tokens anteriores; o servidor devolve um novo
  replaceToken(accessToken: string): void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Profissional | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      const storagedUser = localStorage.getItem('@TreinosApp:user');
      const storagedToken = localStorage.getItem('@TreinosApp:token');

      if (storagedUser && storagedToken) {
        setUser(JSON.parse(storagedUser));
      }
      setLoading(false);
    }

    loadStorageData();
  }, []);

  const login = async (email: string, senha: string) => {
    const response = await api.post('/auth/login', { email, senha });
    const { accessToken, profissional } = response.data;

    // Nada do cache de uma conta anterior pode aparecer para a nova
    memoryCache.clear();
    localStorage.setItem('@TreinosApp:token', accessToken);
    localStorage.setItem('@TreinosApp:user', JSON.stringify(profissional));

    setUser(profissional);
  };

  const register = async (data: any) => {
    await api.post('/auth/register', data);
  };

  const logout = () => {
    localStorage.removeItem('@TreinosApp:token');
    localStorage.removeItem('@TreinosApp:user');
    memoryCache.clear();
    setUser(null);
  };

  // Token expirado ou conta desativada: o servidor responde 401 e o app volta
  // para o login em vez de continuar "logado" com todas as chamadas falhando.
  useEffect(() => {
    setOnUnauthorized(() => {
      if (!localStorage.getItem('@TreinosApp:token')) return;
      logout();
      toast.error('Sua sessão expirou. Entre novamente.', { id: 'sessao-expirada' });
    });
    return () => setOnUnauthorized(null);
  }, []);

  const updateUser = (updatedUser: Partial<Profissional>) => {
    if (user) {
      const newUser = { ...user, ...updatedUser };
      localStorage.setItem('@TreinosApp:user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  const replaceToken = (accessToken: string) => {
    localStorage.setItem('@TreinosApp:token', accessToken);
  };

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, loading, login, register, logout, updateUser, replaceToken }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
