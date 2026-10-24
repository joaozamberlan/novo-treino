// Grupo muscular → região do corpo na ilustração (js-rich-body-highlighter).
// O treinador escolhe a região ao criar o grupo; grupos sem escolha salva
// (os antigos e os criados pelo atalho do modal de exercício) seguem o nome.

// A mesma lista está no backend (dto/grupo-muscular.dto.ts). 'nenhuma' é a
// escolha explícita de "Sem região".
export type RegiaoGrupo =
  | 'peito'
  | 'costas'
  | 'ombros'
  | 'biceps'
  | 'triceps'
  | 'antebraco'
  | 'abdomen'
  | 'gluteos'
  | 'quadriceps'
  | 'posterior_coxa'
  | 'adutores'
  | 'panturrilha'
  | 'nenhuma';

type RegiaoDesenhada = Exclude<RegiaoGrupo, 'nenhuma'>;

interface DefinicaoRegiao {
  rotulo: string;
  // Máscaras da ilustração que acendem. Adutores não têm máscara: a
  // miniatura desenha a face interna da coxa por cima (ver MiniaturaMusculo)
  mascaras: string[];
  // Lado em que a miniatura mostra o músculo
  lado: 'front' | 'back';
  // Faixa do corpo do recorte da miniatura
  faixa: 'tronco' | 'coxa' | 'perna';
}

// Subdivisões usam o desenho do músculo inteiro: ombro anterior, lateral e
// posterior são "Ombros"; peitoral superior e inferior, "Peito"
export const REGIOES: Record<RegiaoDesenhada, DefinicaoRegiao> = {
  peito: { rotulo: 'Peito', mascaras: ['chest'], lado: 'front', faixa: 'tronco' },
  costas: { rotulo: 'Costas', mascaras: ['lats', 'upper_back', 'lower_back'], lado: 'back', faixa: 'tronco' },
  ombros: { rotulo: 'Ombros', mascaras: ['shoulders'], lado: 'front', faixa: 'tronco' },
  biceps: { rotulo: 'Bíceps', mascaras: ['biceps'], lado: 'front', faixa: 'tronco' },
  triceps: { rotulo: 'Tríceps', mascaras: ['triceps'], lado: 'back', faixa: 'tronco' },
  antebraco: { rotulo: 'Antebraço', mascaras: ['forearms'], lado: 'front', faixa: 'tronco' },
  abdomen: { rotulo: 'Abdômen', mascaras: ['abs', 'obliques'], lado: 'front', faixa: 'tronco' },
  gluteos: { rotulo: 'Glúteos', mascaras: ['glutes'], lado: 'back', faixa: 'coxa' },
  quadriceps: { rotulo: 'Quadríceps', mascaras: ['quads'], lado: 'front', faixa: 'coxa' },
  posterior_coxa: { rotulo: 'Posterior de coxa', mascaras: ['hamstrings'], lado: 'back', faixa: 'coxa' },
  adutores: { rotulo: 'Adutores', mascaras: [], lado: 'front', faixa: 'coxa' },
  panturrilha: { rotulo: 'Panturrilha', mascaras: ['calves'], lado: 'back', faixa: 'perna' },
};

// Opções do seletor "Região no corpo", na ordem da lista
export const OPCOES_REGIAO: { valor: RegiaoGrupo; texto: string }[] = [
  ...(Object.keys(REGIOES) as RegiaoDesenhada[]).map((r) => ({ valor: r, texto: REGIOES[r].rotulo })),
  { valor: 'nenhuma', texto: 'Sem região' },
];

const normalizar = (nome: string) =>
  nome.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

// Palpite pelo nome, na ordem em que os casos ambíguos se resolvem:
// "bíceps femoral" é posterior de coxa, não bíceps; "ombro posterior" é
// ombro, não posterior de coxa.
const PALPITES: [RegExp, RegiaoDesenhada][] = [
  [/\bbiceps femoral|\bisquiotibia|\bposterior(es)? d[ae] coxa|\bpost\.? ?(d[ae] )?coxa/, 'posterior_coxa'],
  [/\bombro|\bdeltoide/, 'ombros'],
  [/^posterior(es)?$|\bposteriores\b/, 'posterior_coxa'],
  [/\bpeit|\bpector/, 'peito'],
  [/\bcostas|\bdorsa|\blombar|\btrapezi|\bromboide|\blatissimo/, 'costas'],
  [/\bbiceps/, 'biceps'],
  [/\btriceps/, 'triceps'],
  [/\bantebraco/, 'antebraco'],
  [/\babdom|\bobliquo|\bcore\b/, 'abdomen'],
  [/\bglute/, 'gluteos'],
  [/\bquadriceps|\bquad\b|\b(frente|anterior) d[ae] coxa/, 'quadriceps'],
  [/\badutor/, 'adutores'],
  [/\bpanturrilh|\bgastrocnemio|\bsoleo/, 'panturrilha'],
];

export function sugerirRegiao(nome: string): RegiaoGrupo {
  const n = normalizar(nome);
  return PALPITES.find(([padrao]) => padrao.test(n))?.[1] ?? 'nenhuma';
}

const ehRegiao = (valor: string): valor is RegiaoGrupo =>
  valor === 'nenhuma' || valor in REGIOES;

// Região que vale para o grupo: a escolhida pelo treinador ou, sem escolha
// salva, o palpite pelo nome
export function regiaoDoGrupo(grupo: { nome: string; regiao?: string | null }): RegiaoGrupo {
  return grupo.regiao && ehRegiao(grupo.regiao) ? grupo.regiao : sugerirRegiao(grupo.nome);
}

export function mascarasDaRegiao(regiao: RegiaoGrupo): string[] {
  return regiao === 'nenhuma' ? [] : REGIOES[regiao].mascaras;
}

// Região que a miniatura da Biblioteca sabe desenhar
export function temDesenho(regiao: RegiaoGrupo): regiao is RegiaoDesenhada {
  return regiao !== 'nenhuma';
}
