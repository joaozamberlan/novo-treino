// Tipos e regras do progresso de cargas (mesma resposta em
// GET /treinos/progresso/:idProtocolo e GET /publico/progresso/:token).

export interface SerieFeita {
  numeroSerie: number;
  cargaKg: number | null;
  repeticoes: number | null;
}

export interface SessaoProgresso {
  data: string; // YYYY-MM-DD
  melhor: { cargaKg: number | null; repeticoes: number | null };
  series: SerieFeita[];
}

export interface ExercicioProgresso {
  idTreinoExercicio: number;
  idExercicio: number;
  nome: string;
  grupo: string;
  series: number;
  repeticoes: string;
  faixa: [number, number] | null;
  sessoes: SessaoProgresso[];
}

export interface FichaProgresso {
  idTreino: number;
  nome: string;
  exercicios: ExercicioProgresso[];
}

export interface Progresso {
  ultimaSessao: string | null;
  fichas: FichaProgresso[];
}

// Sinal da faixa prescrita: acima do limite superior = subir carga;
// abaixo do inferior = carga alta. Sem faixa numérica, não há sinal.
export type StatusFaixa = 'acima' | 'dentro' | 'abaixo';

export function statusReps(reps: number | null, faixa: [number, number] | null): StatusFaixa {
  if (reps == null || !faixa) return 'dentro';
  if (reps > faixa[1]) return 'acima';
  if (reps < faixa[0]) return 'abaixo';
  return 'dentro';
}

export const ultimaSessao = (e: ExercicioProgresso) => e.sessoes[e.sessoes.length - 1];

export function statusAtual(e: ExercicioProgresso): StatusFaixa {
  const u = ultimaSessao(e);
  return u ? statusReps(u.melhor.repeticoes, e.faixa) : 'dentro';
}

export const dataParaTs = (data: string) => new Date(`${data}T12:00:00`).getTime();

export const formatData = (data: string | number) =>
  new Date(typeof data === 'number' ? data : dataParaTs(data)).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });

export const formatKg = (kg: number | null) =>
  kg == null ? '—' : String(Number(kg.toFixed(2))).replace('.', ',');

export function diasDesde(data: string) {
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);
  return Math.max(0, Math.round((hoje.getTime() - dataParaTs(data)) / 86_400_000));
}

export function textoDiasDesde(data: string) {
  const d = diasDesde(data);
  return d === 0 ? 'hoje' : d === 1 ? 'ontem' : `há ${d} dias`;
}

// Variação de carga da melhor série entre a primeira e a última sessão
export function variacaoKg(e: ExercicioProgresso) {
  if (e.sessoes.length < 2) return 0;
  return (ultimaSessao(e).melhor.cargaKg ?? 0) - (e.sessoes[0].melhor.cargaKg ?? 0);
}
