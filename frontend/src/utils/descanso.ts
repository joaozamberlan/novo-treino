// Descanso pode ser um valor fixo (60) ou uma faixa (1-3 min). No banco:
// descansoSegundos = mínimo, descansoMaxSegundos = máximo (opcional).

export interface DescansoFaixa {
  min: number;
  max?: number;
}

/** Aceita "90", "60-90", "90s", "2 min", "1-3 min", "1 a 3 min". Sem unidade = segundos. */
export function parseDescanso(texto: string): DescansoFaixa | null {
  const m = texto
    .trim()
    .toLowerCase()
    .match(/^(\d+(?:[.,]\d+)?)\s*(?:(?:-|–|a|até)\s*(\d+(?:[.,]\d+)?))?\s*(min|m|s|seg)?\.?$/);
  if (!m) return null;
  const mult = m[3] === 'min' || m[3] === 'm' ? 60 : 1;
  const toSeg = (v: string) => Math.round(parseFloat(v.replace(',', '.')) * mult);
  const min = toSeg(m[1]);
  const max = m[2] ? toSeg(m[2]) : undefined;
  if (!min) return null;
  if (max !== undefined && max <= min) return { min: Math.min(min, max) || min };
  return { min, max };
}

const fmt = (seg: number) => (seg >= 60 && seg % 60 === 0 ? `${seg / 60}` : `${seg}`);
const unit = (seg: number) => (seg >= 60 && seg % 60 === 0 ? 'min' : 's');

export function formatDescanso(min?: number | null, max?: number | null): string {
  if (!min) return '';
  if (!max || max <= min) return `${fmt(min)}${unit(min) === 'min' ? ' min' : 's'}`;
  if (unit(min) === unit(max)) return `${fmt(min)}-${fmt(max)}${unit(min) === 'min' ? ' min' : 's'}`;
  return `${min}-${max}s`;
}

/** Valor inicial do input de edição. */
export function descansoParaInput(min?: number | null, max?: number | null): string {
  if (!min) return '';
  return max && max > min ? `${min}-${max}` : `${min}`;
}
