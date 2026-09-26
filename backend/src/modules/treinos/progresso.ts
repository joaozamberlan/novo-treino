import { PrismaService } from '../../prisma/prisma.service';

// Progresso de cargas: histórico da melhor série de cada exercício das fichas
// de uma periodização. Usado pelo treinador (autenticado) e pelo link público.
//
// - Conta toda série marcada como feita, mesmo em sessões não encerradas
//   (o aluno costuma esquecer de clicar em "Encerrar treino").
// - Agrupa pelo exercício do catálogo (idExercicio), não pela linha da
//   prescrição, para o histórico continuar entre periodizações.

const MAX_SESSOES = 12;

// "5-8", "5 a 8", "8–12 (falha)" → [5, 8]; "10" → [10, 10]; texto → null
export function parseFaixa(repeticoes: string): [number, number] | null {
  const faixa = repeticoes.match(/(\d+)\s*(?:-|–|a)\s*(\d+)/i);
  if (faixa) {
    const a = Number(faixa[1]);
    const b = Number(faixa[2]);
    return [Math.min(a, b), Math.max(a, b)];
  }
  const unico = repeticoes.match(/^\D*(\d+)\D*$/);
  if (unico) return [Number(unico[1]), Number(unico[1])];
  return null;
}

export interface SerieFeita {
  numeroSerie: number;
  cargaKg: number | null;
  repeticoes: number | null;
}

// Melhor série = maior carga; empate desempata por mais repetições
function melhorSerie(series: SerieFeita[]) {
  return series.reduce((best, s) => {
    const c = s.cargaKg ?? 0;
    const bc = best.cargaKg ?? 0;
    if (c > bc || (c === bc && (s.repeticoes ?? 0) > (best.repeticoes ?? 0)))
      return s;
    return best;
  });
}

export async function buildProgresso(
  prisma: PrismaService,
  idAluno: number,
  idProtocolo: number,
) {
  const treinos = await prisma.treino.findMany({
    where: { idProtocolo, ativo: true },
    orderBy: { ordem: 'asc' },
    select: {
      idTreino: true,
      nome: true,
      exercicios: {
        where: { ativo: true },
        orderBy: { ordem: 'asc' },
        select: {
          idTreinoExercicio: true,
          idExercicio: true,
          series: true,
          repeticoes: true,
          exercicio: {
            select: { nome: true, grupoMuscular: { select: { nome: true } } },
          },
        },
      },
    },
  });

  const idsExercicio = [
    ...new Set(treinos.flatMap((t) => t.exercicios.map((e) => e.idExercicio))),
  ];

  const series = idsExercicio.length
    ? await prisma.sessaoExercicioSerie.findMany({
        where: {
          concluido: true,
          sessao: { idAluno },
          treinoExercicio: { idExercicio: { in: idsExercicio } },
          OR: [{ cargaKg: { not: null } }, { repeticoes: { not: null } }],
        },
        select: {
          idSessao: true,
          numeroSerie: true,
          cargaKg: true,
          repeticoes: true,
          sessao: { select: { data: true } },
          treinoExercicio: { select: { idExercicio: true } },
        },
      })
    : [];

  // idExercicio → idSessao → { data, series }
  const porExercicio = new Map<
    number,
    Map<number, { data: string; series: SerieFeita[] }>
  >();
  for (const s of series) {
    const idEx = s.treinoExercicio.idExercicio;
    let sessoes = porExercicio.get(idEx);
    if (!sessoes) porExercicio.set(idEx, (sessoes = new Map()));
    let sessao = sessoes.get(s.idSessao);
    if (!sessao)
      sessoes.set(s.idSessao, (sessao = { data: s.sessao.data, series: [] }));
    sessao.series.push({
      numeroSerie: s.numeroSerie,
      cargaKg: s.cargaKg,
      repeticoes: s.repeticoes,
    });
  }

  const historico = (idExercicio: number) =>
    [...(porExercicio.get(idExercicio)?.entries() ?? [])]
      .sort(([idA, a], [idB, b]) => a.data.localeCompare(b.data) || idA - idB)
      .slice(-MAX_SESSOES)
      .map(([, s]) => {
        const ordenadas = [...s.series].sort(
          (a, b) => a.numeroSerie - b.numeroSerie,
        );
        const melhor = melhorSerie(ordenadas);
        return {
          data: s.data,
          melhor: { cargaKg: melhor.cargaKg, repeticoes: melhor.repeticoes },
          series: ordenadas,
        };
      });

  const datas = series.map((s) => s.sessao.data).sort();

  return {
    ultimaSessao: datas.length ? datas[datas.length - 1] : null,
    fichas: treinos.map((t) => ({
      idTreino: t.idTreino,
      nome: t.nome,
      exercicios: t.exercicios.map((e) => ({
        idTreinoExercicio: e.idTreinoExercicio,
        idExercicio: e.idExercicio,
        nome: e.exercicio.nome,
        grupo: e.exercicio.grupoMuscular.nome,
        series: e.series,
        repeticoes: e.repeticoes,
        faixa: parseFaixa(e.repeticoes),
        sessoes: historico(e.idExercicio),
      })),
    })),
  };
}
