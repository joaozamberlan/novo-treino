// Aeróbico da ficha: modelos fixos, iguais para todos os treinadores. O
// treinador escolhe o modelo e os minutos; o aluno lê a explicação no app.
// Os códigos espelham CARDIO_TIPOS em backend/src/modules/treinos/dto/limites.ts.

export type CardioTipo = 'CONTINUO' | 'HIIT_1X1' | 'HIIT_4X4' | 'SIT';

export const MAX_CARDIO_MINUTOS = 300;

export interface CardioModelo {
  tipo: CardioTipo;
  nome: string;
  // Valor que entra no campo quando o treinador escolhe o modelo. Sem ele
  // (contínuo), o campo começa vazio e o treinador decide o tempo.
  minutosSugeridos?: number;
  // Duração usual em minutos; fora dela o treinador só recebe um aviso
  faixa?: [number, number];
  // minutos null = o treinador ainda não informou o tempo
  comoFazer: (minutos: number | null) => string;
  detalhes: { rotulo: string; texto: string }[];
}

export const CARDIO_MODELOS: CardioModelo[] = [
  {
    tipo: 'CONTINUO',
    nome: 'Contínuo',
    comoFazer: (minutos) =>
      `${minutos ?? 'XX'} minutos de aeróbico contínuo, pós-treino ou em outro horário.`,
    detalhes: [],
  },
  {
    tipo: 'HIIT_1X1',
    nome: 'HIIT 1:1',
    minutosSugeridos: 20,
    faixa: [20, 28],
    comoFazer: () =>
      'Tiros de 60 segundos em esforço forte, alternados com 60 segundos de recuperação ativa (trote leve ou caminhada). Repita até completar o tempo prescrito.',
    detalhes: [
      { rotulo: 'Intensidade alvo', texto: '85% a 95% da frequência cardíaca máxima.' },
      { rotulo: 'Esforço/pausa', texto: '1:1.' },
      { rotulo: 'Duração usual', texto: '20 a 28 minutos.' },
    ],
  },
  {
    tipo: 'HIIT_4X4',
    nome: 'HIIT 4x4',
    minutosSugeridos: 25,
    faixa: [25, 28],
    comoFazer: () =>
      '4 séries de 4 minutos em esforço forte, com 3 minutos de pausa entre elas.',
    detalhes: [
      { rotulo: 'Intensidade alvo', texto: '90% da frequência cardíaca máxima.' },
      { rotulo: 'Duração usual', texto: '25 a 28 minutos.' },
    ],
  },
  {
    tipo: 'SIT',
    nome: 'SIT',
    minutosSugeridos: 15,
    faixa: [15, 25],
    comoFazer: () =>
      '4 a 6 sprints de 20 a 30 segundos, seguidos de 3 a 4 minutos de recuperação parada ou em caminhada bem leve.',
    detalhes: [
      { rotulo: 'Intensidade alvo', texto: 'Esforço máximo absoluto.' },
      {
        rotulo: 'Esforço/pausa',
        texto: '1:8 a 1:12. A pausa longa é obrigatória para manter o máximo no sprint seguinte.',
      },
      { rotulo: 'Duração usual', texto: '15 a 25 minutos.' },
    ],
  },
];

export function modeloCardio(tipo: string | null | undefined): CardioModelo | undefined {
  return CARDIO_MODELOS.find((m) => m.tipo === tipo);
}

// Aeróbico prescrito numa ficha; undefined quando não há (ou o tipo é desconhecido)
export function cardioDaFicha(
  ficha: { cardioTipo?: string | null; cardioMinutos?: number | null } | null | undefined,
): { modelo: CardioModelo; minutos: number } | undefined {
  const modelo = modeloCardio(ficha?.cardioTipo);
  if (!modelo || !ficha?.cardioMinutos) return undefined;
  return { modelo, minutos: ficha.cardioMinutos };
}

// Minutos digitados → inteiro válido, ou null
export function parseMinutosCardio(texto: string): number | null {
  const n = Number(String(texto).trim());
  return Number.isInteger(n) && n >= 1 && n <= MAX_CARDIO_MINUTOS ? n : null;
}
