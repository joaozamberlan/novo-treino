import { useEffect, useState } from 'react';
import { VolumeSemanal } from '../../components/VolumeSemanal';
import type { FichaTreino, PrescribedExercise } from '../../types/treino';

// Protótipo (só em `vite dev`): volume semanal com fichas de exemplo, para
// conferir o mapa do corpo e o placar sem backend nem login.
// ?tema=claro|escuro escolhe o tema ao abrir.

let id = 0;
const ex = (grupo: string, series: number): PrescribedExercise => {
  id += 1;
  return {
    idTreinoExercicio: id,
    series,
    repeticoes: '8-12',
    ordem: id,
    exercicio: { idExercicio: id, nome: `${grupo} ${id}`, grupoMuscular: { idGrupoMuscular: id, nome: grupo } },
  } as PrescribedExercise;
};

const ficha = (idTreino: number, nome: string, ordem: number, exercicios: PrescribedExercise[]): FichaTreino =>
  ({ idTreino, nome, ordem, exercicios } as FichaTreino);

const FICHAS: FichaTreino[] = [
  ficha(1, 'Upper', 1, [ex('Peito', 4), ex('Costas', 4), ex('Ombro', 3)]),
  ficha(2, 'Lower', 2, [ex('Quadríceps', 6), ex('Isquiotibiais', 4), ex('Glúteos', 3), ex('Panturrilha', 3), ex('Adutores', 2)]),
  ficha(3, 'Pull', 3, [ex('Costas', 6), ex('Bíceps', 4), ex('Antebraço', 2)]),
  ficha(4, 'Full body', 4, [ex('Peito', 3), ex('Tríceps', 3), ex('Abdômen', 3), ex('Ombro', 2)]),
];

export function VolumePrototype() {
  const [claro, setClaro] = useState(() => {
    const tema = new URLSearchParams(window.location.search).get('tema');
    if (tema === 'claro') document.body.classList.add('light-theme');
    if (tema === 'escuro') document.body.classList.remove('light-theme');
    return document.body.classList.contains('light-theme');
  });
  useEffect(() => {
    document.title = 'Protótipo: volume semanal';
  }, []);
  const alternar = () => {
    document.body.classList.toggle('light-theme');
    setClaro(document.body.classList.contains('light-theme'));
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '1.5rem 1rem 4rem' }}>
      <button type="button" className="btn btn-secondary btn-sm" onClick={alternar}>
        Tema {claro ? 'escuro' : 'claro'}
      </button>
      <VolumeSemanal fichas={FICHAS} idFichaAtual={new URLSearchParams(window.location.search).get('visao') === 'semana' ? null : 1} />
    </div>
  );
}
