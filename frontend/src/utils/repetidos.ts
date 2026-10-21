import type { FichaTreino } from '../types/treino';

// Onde cada exercício do catálogo aparece nas fichas de uma periodização.
// Base do aviso de exercício repetido: só avisa, nunca bloqueia.
export interface Ocorrencia {
  idTreino: number;
  nomeFicha: string;
  idTreinoExercicio: number;
}

export type MapaOcorrencias = Map<number, Ocorrencia[]>;

export function mapaOcorrencias(fichas: FichaTreino[]): MapaOcorrencias {
  const mapa: MapaOcorrencias = new Map();
  const ordenadas = [...fichas].sort((a, b) => a.ordem - b.ordem);
  for (const ficha of ordenadas) {
    for (const item of ficha.exercicios) {
      const lista = mapa.get(item.exercicio.idExercicio) ?? [];
      lista.push({ idTreino: ficha.idTreino, nomeFicha: ficha.nome, idTreinoExercicio: item.idTreinoExercicio });
      mapa.set(item.exercicio.idExercicio, lista);
    }
  }
  return mapa;
}

// As outras ocorrências de um exercício, tirando a própria linha (na edição)
export function outrasOcorrencias(
  mapa: MapaOcorrencias,
  idExercicio: number,
  idTreinoExercicioIgnorado?: number | null,
): Ocorrencia[] {
  return (mapa.get(idExercicio) ?? []).filter((o) => o.idTreinoExercicio !== idTreinoExercicioIgnorado);
}

// "Upper", "Upper, Pull": nomes das outras fichas, sem repetir e na ordem delas
export function nomesDasFichas(ocorrencias: Ocorrencia[], idTreinoAtual: number): string {
  const nomes: string[] = [];
  for (const o of ocorrencias) {
    if (o.idTreino !== idTreinoAtual && !nomes.includes(o.nomeFicha)) nomes.push(o.nomeFicha);
  }
  return nomes.join(', ');
}
