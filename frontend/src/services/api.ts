import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@TreinosApp:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Chamado quando uma requisição autenticada volta 401 (token expirado ou conta
// desativada). O AuthProvider registra aqui o próprio logout.
let onUnauthorized: (() => void) | null = null;

export function setOnUnauthorized(handler: (() => void) | null) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Só requisições que foram com token: um 401 do /auth/login é senha errada,
    // não sessão expirada.
    if (error?.response?.status === 401 && error.config?.headers?.Authorization) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  },
);

export default api;
