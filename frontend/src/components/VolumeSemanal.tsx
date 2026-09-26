import { useId } from 'react';
import type { FichaTreino } from '../types/treino';

// Séries prescritas por grupo muscular somando todas as fichas da
// periodização. Cada barra separa a parte da ficha aberta na tela do
// restante da semana, para o treinador (e o aluno) verem quanto aquela
// ficha pesa em cada grupo.

interface VolumeSemanalProps {
  fichas: FichaTreino[];
  idFichaAtual?: number | null;
}

interface LinhaVolume {
  grupo: string;
  total: number;
  daFicha: number;
}

function calcularVolume(fichas: FichaTreino[], idFichaAtual?: number | null): LinhaVolume[] {
  const porGrupo = new Map<string, LinhaVolume>();
  for (const ficha of fichas) {
    for (const item of ficha.exercicios || []) {
      const grupo = item.exercicio.grupoMuscular?.nome || 'Outro';
      const series = Number(item.series) || 0;
      const linha = porGrupo.get(grupo) ?? { grupo, total: 0, daFicha: 0 };
      linha.total += series;
      if (ficha.idTreino === idFichaAtual) linha.daFicha += series;
      porGrupo.set(grupo, linha);
    }
  }
  return [...porGrupo.values()]
    .filter((l) => l.total > 0)
    .sort((a, b) => b.total - a.total || a.grupo.localeCompare(b.grupo, 'pt-BR'));
}

const series = (n: number) => `${n} ${n === 1 ? 'série' : 'séries'}`;

export function VolumeSemanal({ fichas, idFichaAtual }: VolumeSemanalProps) {
  const tituloId = useId();
  const linhas = calcularVolume(fichas, idFichaAtual);
  if (linhas.length === 0) return null;

  const fichaAtual = fichas.find((f) => f.idTreino === idFichaAtual);
  const maior = linhas[0].total;
  const totalSemana = linhas.reduce((acc, l) => acc + l.total, 0);
  const destacaFicha = !!fichaAtual && fichas.length > 1;

  return (
    <section className="vol-semanal" aria-labelledby={tituloId}>
      <header className="vol-head">
        <h2 id={tituloId}>Volume semanal</h2>
        <p>
          {series(totalSemana)} em {linhas.length} {linhas.length === 1 ? 'grupo muscular' : 'grupos musculares'}, somando todas as fichas
        </p>
      </header>

      {destacaFicha && (
        <div className="vol-legenda">
          <span className="vol-legenda-item">
            <span className="vol-swatch atual" aria-hidden="true" />
            <span className="vol-legenda-texto">{fichaAtual.nome}</span>
          </span>
          <span className="vol-legenda-item">
            <span className="vol-swatch outras" aria-hidden="true" />
            <span className="vol-legenda-texto">Demais fichas</span>
          </span>
        </div>
      )}

      <ul className="vol-lista">
        {linhas.map((l) => {
          const outras = l.total - l.daFicha;
          const detalhe = destacaFicha ? `${l.daFicha} nesta ficha, ${outras} nas demais` : '';
          return (
            <li key={l.grupo} className="vol-linha" title={detalhe ? `${l.grupo}: ${series(l.total)} (${detalhe})` : undefined}>
              <span className="vol-grupo">{l.grupo}</span>
              <span className="vol-trilho" aria-hidden="true">
                <span className="vol-barra" style={{ width: `${Math.max((l.total / maior) * 100, 4)}%` }}>
                  {destacaFicha ? (
                    <>
                      {l.daFicha > 0 && <span className="vol-seg atual" style={{ flexGrow: l.daFicha }} />}
                      {outras > 0 && <span className="vol-seg outras" style={{ flexGrow: outras }} />}
                    </>
                  ) : (
                    <span className="vol-seg atual" style={{ flexGrow: 1 }} />
                  )}
                </span>
              </span>
              <span className="vol-valor">
                <b>{l.total}</b> {l.total === 1 ? 'série' : 'séries'}
                {detalhe && <span className="sr-only">, {detalhe}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
