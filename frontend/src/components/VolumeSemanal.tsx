import { useId, useState } from 'react';
import type { FichaTreino } from '../types/treino';

// Séries prescritas por grupo muscular. Um controle segmentado alterna entre
// a ficha aberta na tela e a semana inteira (todas as fichas da
// periodização); cada visão mostra só o próprio número, numa barra de uma cor.

interface VolumeSemanalProps {
  fichas: FichaTreino[];
  idFichaAtual?: number | null;
}

type Visao = 'ficha' | 'semana';

interface LinhaVolume {
  grupo: string;
  series: number;
}

function calcularVolume(fichas: FichaTreino[]): LinhaVolume[] {
  const porGrupo = new Map<string, number>();
  for (const ficha of fichas) {
    for (const item of ficha.exercicios || []) {
      const grupo = item.exercicio.grupoMuscular?.nome || 'Outro';
      porGrupo.set(grupo, (porGrupo.get(grupo) ?? 0) + (Number(item.series) || 0));
    }
  }
  return [...porGrupo.entries()]
    .map(([grupo, series]) => ({ grupo, series }))
    .filter((l) => l.series > 0)
    .sort((a, b) => b.series - a.series || a.grupo.localeCompare(b.grupo, 'pt-BR'));
}

const series = (n: number) => `${n} ${n === 1 ? 'série' : 'séries'}`;
const grupos = (n: number) => `${n} ${n === 1 ? 'grupo muscular' : 'grupos musculares'}`;

export function VolumeSemanal({ fichas, idFichaAtual }: VolumeSemanalProps) {
  const tituloId = useId();
  const [visao, setVisao] = useState<Visao>('ficha');

  const fichaAtual = fichas.find((f) => f.idTreino === idFichaAtual);
  // Com uma ficha só, "esta ficha" e "semana" são a mesma coisa: sem alternância.
  const podeAlternar = !!fichaAtual && fichas.length > 1;
  const visaoAtiva: Visao = podeAlternar ? visao : 'semana';

  const linhasSemana = calcularVolume(fichas);
  if (linhasSemana.length === 0) return null;

  const linhas = visaoAtiva === 'ficha' && fichaAtual ? calcularVolume([fichaAtual]) : linhasSemana;
  const maior = linhas[0]?.series ?? 0;
  const total = linhas.reduce((acc, l) => acc + l.series, 0);

  const resumo = visaoAtiva === 'ficha'
    ? `${fichaAtual!.nome} · ${series(total)} em ${grupos(linhas.length)}`
    : `${series(total)} em ${grupos(linhas.length)}, somando ${fichas.length === 1 ? 'a ficha' : `as ${fichas.length} fichas`}`;

  return (
    <section className="vol-semanal" aria-labelledby={tituloId}>
      <header className="vol-head">
        <h2 id={tituloId}>Volume semanal</h2>
      </header>

      {podeAlternar && (
        <div className="vol-segmentado" role="group" aria-label="Mostrar volume de" data-visao={visaoAtiva}>
          <button type="button" aria-pressed={visaoAtiva === 'ficha'} onClick={() => setVisao('ficha')}>
            Esta ficha
          </button>
          <button type="button" aria-pressed={visaoAtiva === 'semana'} onClick={() => setVisao('semana')}>
            Semana
          </button>
        </div>
      )}

      <p className="vol-resumo" aria-live="polite">{resumo}</p>

      {linhas.length > 0 ? (
        <ul className="vol-lista">
          {linhas.map((l) => (
            <li key={l.grupo} className="vol-linha">
              <span className="vol-grupo">{l.grupo}</span>
              <span className="vol-trilho" aria-hidden="true">
                <span className="vol-barra" style={{ width: `${Math.max((l.series / maior) * 100, 4)}%` }} />
              </span>
              <span className="vol-valor">
                <b>{l.series}</b> {l.series === 1 ? 'série' : 'séries'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="vol-vazio">Esta ficha ainda não tem exercícios.</p>
      )}
    </section>
  );
}
