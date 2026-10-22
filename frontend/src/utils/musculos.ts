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
