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
