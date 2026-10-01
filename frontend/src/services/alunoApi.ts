import axios from 'axios';
import { ALUNO_TOKEN_KEY } from '../constants/storageKeys';

// Cliente das rotas /aluno/*. Instância própria para o token do aluno nunca
// se misturar com o do treinador (services/api.ts) no mesmo aparelho.
const alunoApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

alunoApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(ALUNO_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chamado quando uma requisição com token volta 401: o treinador redefiniu o
// PIN ou revogou o acesso, ou a sessão venceu. O AlunoAuthProvider registra
// aqui a própria saída.
let onUnauthorized: ((mensagem?: string) => void) | null = null;

export function setOnAlunoUnauthorized(handler: ((mensagem?: string) => void) | null) {
  onUnauthorized = handler;
}

alunoApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Um 401 de /aluno/auth/* é telefone ou PIN errado, não sessão encerrada
    // (e pode ter ido com o token de uma sessão que continua válida).
    const ehLogin = String(error?.config?.url ?? '').startsWith('/aluno/auth/');
    if (error?.response?.status === 401 && error.config?.headers?.Authorization && !ehLogin) {
      onUnauthorized?.(error.response.data?.message);
    }
    return Promise.reject(error);
  },
);

export default alunoApi;
