// Estado de uma periodização a partir das datas. É só informativo: nada muda
// automaticamente quando ela vence — quem decide a periodização atual é o treinador.

export type EstadoPeriodo = 'futura' | 'andamento' | 'encerrada';

const dia = (iso: string) => iso.split('T')[0];

const hoje = () => {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
};

export function estadoPeriodo(dataInicio?: string | null, dataFim?: string | null): EstadoPeriodo | null {
  if (!dataInicio && !dataFim) return null;
  const h = hoje();
  if (dataFim && dia(dataFim) < h) return 'encerrada';
  if (dataInicio && dia(dataInicio) > h) return 'futura';
  return 'andamento';
}

export const ROTULO_ESTADO: Record<EstadoPeriodo, string> = {
  futura: 'Futura',
  andamento: 'Em andamento',
  encerrada: 'Encerrada',
};

export function formatarDia(iso?: string | null): string | null {
  if (!iso) return null;
  const [a, m, d] = dia(iso).split('-');
  return a && m && d ? `${d}/${m}/${a}` : iso;
}

// Onde o aluno está dentro do período, em semanas. Só com as duas datas; fora
// do intervalo a semana fica presa ao início ou ao fim.
export function progressoPeriodo(
  dataInicio?: string | null,
  dataFim?: string | null,
): { semana: number; totalSemanas: number; fracao: number } | null {
  if (!dataInicio || !dataFim) return null;
  const ini = new Date(`${dia(dataInicio)}T00:00:00`).getTime();
  const fim = new Date(`${dia(dataFim)}T00:00:00`).getTime();
  const agora = new Date(`${hoje()}T00:00:00`).getTime();
  if (!(fim > ini)) return null;
  const SEMANA = 7 * 24 * 60 * 60 * 1000;
  const totalSemanas = Math.max(1, Math.ceil((fim - ini) / SEMANA));
  const fracao = Math.min(1, Math.max(0, (agora - ini) / (fim - ini)));
  const semana = Math.min(totalSemanas, Math.max(1, Math.floor((agora - ini) / SEMANA) + 1));
  return { semana, totalSemanas, fracao };
}
