// Limites numéricos da prescrição. MAX_SERIES acompanha o máximo de séries
// que o aluno consegue registrar por exercício no link público.
export const MAX_SERIES = 30;
export const MAX_DESCANSO_SEGUNDOS = 3600;
export const MAX_ORDEM = 10_000;

// Aeróbico da ficha: modelos fixos, iguais para todos os treinadores. Os
// textos de cada modelo ficam no frontend (utils/cardio.ts).
export const CARDIO_TIPOS = ['CONTINUO', 'HIIT_1X1', 'HIIT_4X4', 'SIT'];
export const MAX_CARDIO_MINUTOS = 300;
