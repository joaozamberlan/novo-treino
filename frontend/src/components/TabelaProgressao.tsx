// Tabela de progressão semanal: replica a tabela do plano de treino em PDF.
// É só informativa e igual para todos os treinos — não indica em qual semana
// o aluno está.
const SEMANAS = [
  'Definir a carga correta para a média de repetições',
  'Ajustar a carga para a média de repetições',
  'Aumentar a carga e executar o limite inferior de repetições',
  'Ajustar a carga para a média de reps e reduzir uma série por exercício',
  'Ajustar a carga para a da semana 3 e realizar 1 repetição acima do limite inferior',
];

// Resumo de cada semana em fichas (na tela): o que muda na carga, nas reps e
// nas séries. "forte" marca a mudança que o aluno precisa notar.
const RESUMO: { texto: string; forte?: boolean }[][] = [
  [{ texto: 'carga: definir' }, { texto: 'reps: média' }],
  [{ texto: 'carga: ajustar' }, { texto: 'reps: média' }],
  [{ texto: 'carga ↑', forte: true }, { texto: 'reps: mínimo' }],
  [{ texto: 'carga: ajustar' }, { texto: 'reps: média' }, { texto: 'séries −1', forte: true }],
  [{ texto: 'carga da sem. 3' }, { texto: 'reps: mín. +1' }],
];

export function TabelaProgressao({ variant }: { variant: 'screen' | 'print' }) {
  if (variant === 'print') {
    return (
      <div className="print-treino-block">
        <div className="print-treino-header">
          <div className="print-treino-title-wrap">
            <span className="print-treino-badge">PROGRESSÃO</span>
            <h2 className="print-treino-title">Progressão Semanal</h2>
          </div>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>SEMANA</th>
              <th>INSTRUÇÃO (TODOS OS TREINOS)</th>
            </tr>
          </thead>
          <tbody>
            {SEMANAS.map((texto, i) => (
              <tr key={i}>
                <td className="print-td-num">Semana {i + 1}</td>
                <td>{texto}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <section className="progressao" aria-labelledby="progressaoTitulo">
      <header className="progressao-head">
        <h2 id="progressaoTitulo">Progressão semanal</h2>
        <span>Vale para todos os treinos</span>
      </header>
      <ol className="progressao-lista">
        {SEMANAS.map((texto, i) => (
          <li key={i} className="progressao-semana">
            <span className="progressao-num">
              <small>Semana</small>
              {i + 1}
            </span>
            <p>{texto}</p>
            <span className="progressao-resumo" aria-hidden="true">
              {RESUMO[i].map((r) => (
                <span key={r.texto} className={r.forte ? 'forte' : undefined}>
                  {r.texto}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
