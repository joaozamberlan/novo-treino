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

  const cell = { padding: '0.6rem 0.75rem', borderTop: '1px solid var(--border)', verticalAlign: 'top' as const };
  const head = {
    padding: '0.55rem 0.75rem',
    textAlign: 'left' as const,
    fontFamily: 'var(--font-mono)',
    fontSize: '0.68rem',
    letterSpacing: '0.08em',
    color: 'var(--text-2)',
    backgroundColor: 'var(--bg-2, rgba(128,128,128,0.08))',
  };

  return (
    <div className="card" style={{ marginTop: '1.25rem', padding: 0, overflow: 'hidden' }}>
      <h2 style={{ fontSize: '0.95rem', margin: 0, padding: '0.85rem 0.75rem 0.65rem' }}>Progressão semanal</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr>
            <th style={{ ...head, width: '5.5rem' }}>SEMANA</th>
            <th style={head}>INSTRUÇÃO PARA TODOS OS TREINOS</th>
          </tr>
        </thead>
        <tbody>
          {SEMANAS.map((texto, i) => (
            <tr key={i}>
              <td style={{ ...cell, fontWeight: 700, color: 'var(--accent)', whiteSpace: 'nowrap' }}>Semana {i + 1}</td>
              <td style={{ ...cell, color: 'var(--text-1)', lineHeight: 1.4 }}>{texto}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
