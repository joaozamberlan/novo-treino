// UUID v4 é o formato usado tanto pelo tokenAcesso público (Aluno.tokenAcesso)
// quanto por qualquer outro identificador aleatório futuro. Nunca deve aparecer
// em logs de aplicação — só nos parâmetros reais da requisição.
const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

/**
 * Remove segmentos que pareçam tokens (UUID) de uma URL antes de logar.
 * Usado em toda parte do código que loga `request.url`/`request.originalUrl`,
 * já que rotas públicas (`/publico/sessao/:token/...`) carregam o
 * tokenAcesso do aluno diretamente no caminho.
 */
export function redactSensitiveUrlSegments(url: string): string {
  return url.replace(UUID_PATTERN, '[token-redacted]');
}
