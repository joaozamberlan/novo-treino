import { useState } from 'react';
import { MeuProgresso, PainelProgresso } from '../../components/Progresso';
import { TabelaProgressao } from '../../components/TabelaProgressao';
import type { ExercicioProgresso, Progresso } from '../../utils/progresso';

// Protótipo (só em `vite dev`): painel de progresso e tabela de progressão com
// dados de exemplo, para conferir o visual sem backend nem login.

const exercicio = (
  id: number,
  nome: string,
  series: number,
  repeticoes: string,
  faixa: [number, number],
  sessoes: [string, number, number][],
): ExercicioProgresso => ({
  idTreinoExercicio: id,
  idExercicio: id,
  nome,
  grupo: '',
  series,
  repeticoes,
  faixa,
  sessoes: sessoes.map(([data, cargaKg, repeticoes]) => ({
    data,
    melhor: { cargaKg, repeticoes },
    series: Array.from({ length: series }, (_, i) => ({ numeroSerie: i + 1, cargaKg, repeticoes: repeticoes - (i > 0 ? 1 : 0) })),
  })),
});

const EXEMPLO: Progresso = {
  ultimaSessao: '2026-10-13',
  fichas: [
    {
      idTreino: 1,
      nome: 'Treino A · Peito e tríceps',
      cardio: { tipo: 'esteira', minutos: 20, sessoes: [{ data: '2026-10-06', minutos: 20 }, { data: '2026-10-13', minutos: 15 }] },
      exercicios: [
        exercicio(1, 'Supino reto com barra', 3, '8-10', [8, 10], [
          ['2026-09-08', 60, 8], ['2026-09-15', 62.5, 9], ['2026-09-22', 62.5, 10],
          ['2026-09-29', 65, 8], ['2026-10-06', 65, 9], ['2026-10-13', 67.5, 11],
        ]),
        exercicio(2, 'Agachamento livre', 3, '6-8', [6, 8], [
          ['2026-09-08', 90, 7], ['2026-09-15', 95, 6], ['2026-09-22', 95, 7],
          ['2026-09-29', 100, 5], ['2026-10-06', 100, 6], ['2026-10-13', 100, 5],
        ]),
        exercicio(3, 'Tríceps na polia', 3, '10-12', [10, 12], [['2026-10-13', 25, 11]]),
      ],
    },
  ],
};

export function ProgressoPrototype() {
  const [claro, setClaro] = useState(document.body.classList.contains('light-theme'));
  const alternar = () => {
    document.body.classList.toggle('light-theme');
    setClaro(document.body.classList.contains('light-theme'));
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem 4rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={alternar}>
        Tema {claro ? 'escuro' : 'claro'}
      </button>
      <PainelProgresso progresso={EXEMPLO} />
      <MeuProgresso progresso={EXEMPLO} idTreino={1} />
      <TabelaProgressao variant="screen" />
    </div>
  );
}
