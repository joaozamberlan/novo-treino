// URL pública da API. Aceita BACKEND_URL com ou sem protocolo e com barra no
// fim: uma URL sem "https://" vira caminho relativo no navegador e quebra
// qualquer imagem montada a partir dela.
export function apiBaseUrl(): string {
  const raw = (process.env.BACKEND_URL || 'http://localhost:3000').trim();
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, '');
}
