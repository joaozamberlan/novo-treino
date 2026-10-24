// Grupo muscular do catálogo → regiões do mapa do corpo (js-rich-body-highlighter).
// Adutores não têm região na ilustração: aparecem só no placar, assim como
// qualquer grupo que o treinador criar e não estiver aqui.
const REGIOES: Record<string, string[]> = {
  peito: ['chest'],
  costas: ['lats', 'upper_back', 'lower_back'],
  ombro: ['shoulders'],
  ombros: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  antebraco: ['forearms'],
  abdomen: ['abs', 'obliques'],
  gluteos: ['glutes'],
  quadriceps: ['quads'],
  isquiotibiais: ['hamstrings'],
  panturrilha: ['calves'],
};

const normalizar = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function regioesDoGrupo(grupo: string): string[] {
  return REGIOES[normalizar(grupo)] ?? [];
}

// Regiões que só aparecem (ou aparecem melhor) nas costas da ilustração
const REGIOES_DE_COSTAS = new Set(['lats', 'upper_back', 'lower_back', 'triceps', 'glutes', 'hamstrings', 'calves']);

// Recorte da miniatura: a ilustração inteira fica pequena demais para ver o
// músculo, então ela mostra só a faixa do corpo onde ele está
const REGIOES_DA_COXA = new Set(['glutes', 'quads', 'hamstrings']);

export function faixaDoGrupo(grupo: string): 'tronco' | 'coxa' | 'perna' {
  const regioes = regioesDoGrupo(grupo);
  if (regioes.length > 0 && regioes.every((r) => r === 'calves')) return 'perna';
  if (regioes.length > 0 && regioes.every((r) => REGIOES_DA_COXA.has(r))) return 'coxa';
  return 'tronco';
}

// Lado do corpo em que o grupo se vê: a miniatura da Biblioteca mostra um só
export function ladoDoGrupo(grupo: string): 'front' | 'back' {
  const regioes = regioesDoGrupo(grupo);
  return regioes.length > 0 && regioes.every((r) => REGIOES_DE_COSTAS.has(r)) ? 'back' : 'front';
}
