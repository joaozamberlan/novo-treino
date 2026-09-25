// Nota exibida no fim de cada treino (tela do link público e PDF).
// Parágrafos são separados por linha em branco.
export function RodapeTreino({ texto, variant }: { texto: string; variant: 'screen' | 'print' }) {
  if (!texto) return null;
  const paragrafos = texto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  if (variant === 'print') {
    return (
      <div className="print-treino-rodape">
        {paragrafos.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        margin: '1rem 0',
        padding: '0.7rem 0.9rem',
        borderLeft: '3px solid var(--accent)',
        backgroundColor: 'var(--bg-1)',
        borderRadius: 'var(--radius-m)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.4rem',
      }}
    >
      {paragrafos.map((p, i) => (
        <p key={i} style={{ margin: 0, fontSize: '0.78rem', lineHeight: 1.45, color: 'var(--text-1)', whiteSpace: 'pre-line' }}>
          {p}
        </p>
      ))}
    </div>
  );
}
