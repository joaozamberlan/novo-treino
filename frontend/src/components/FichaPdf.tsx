import { RodapeTreino } from './RodapeTreino';
import { TabelaProgressao } from './TabelaProgressao';
import { rodapeEfetivo } from '../utils/rodape';
import { formatDescanso } from '../utils/descanso';
import type { FichaTreino, Protocolo } from '../types/treino';

// Documento do PDF da periodização (oculto na tela, capturado pelo html2pdf em
// baixarPdfDoTreino). É o mesmo para o treinador e para o link do aluno.

interface ProfissionalPdf {
  nome?: string;
  cref?: string;
  profissao?: string;
  telefone?: string;
  instagram?: string;
  logoUrl?: string;
  rodapeTreino?: string | null;
}

interface FichaPdfProps {
  profissional: ProfissionalPdf | null | undefined;
  aluno: { nome: string; email?: string | null };
  protocolo: Protocolo;
  // Fichas impressas; por padrão todas. Totais e volume sempre consideram a periodização inteira.
  fichas?: FichaTreino[];
  paginaPorFicha?: boolean;
  mostrarRodape?: boolean;
}

const porOrdem = <T extends { ordem: number }>(itens: T[] | undefined) =>
  [...(itens || [])].sort((a, b) => a.ordem - b.ordem);

const formatPrintDate = (dateStr?: string | null) => {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateStr).toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

export function FichaPdf({
  profissional,
  aluno,
  protocolo,
  fichas,
  paginaPorFicha = true,
  mostrarRodape = true,
}: FichaPdfProps) {
  const todasFichas = porOrdem(protocolo.treinos);
  const fichasImpressas = fichas ?? todasFichas;

  const totalSeriesProtocolo = todasFichas.reduce(
    (acc, t) => acc + (t.exercicios?.reduce((sAcc, e) => sAcc + (Number(e.series) || 0), 0) || 0),
    0,
  );
  const totalExerciciosProtocolo = todasFichas.reduce((acc, t) => acc + (t.exercicios?.length || 0), 0);

  const volumeSemanalPorGrupo = (() => {
    const acc: Record<string, number> = {};
    todasFichas.forEach((t) => {
      t.exercicios?.forEach((item) => {
        const grupo = item.exercicio.grupoMuscular?.nome || 'Outro';
        acc[grupo] = (acc[grupo] || 0) + (Number(item.series) || 0);
      });
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  })();

  return (
    <div id="print-section" className="print-only">
      <div className="print-document">
        {/* Red accent bar */}
        <div className="print-accent-bar" />

        {/* Document Header */}
        <header className="print-header">
          <div className="print-header-brand">
            {profissional?.logoUrl ? (
              <img src={profissional.logoUrl} alt="Logo Profissional" className="print-logo" />
            ) : (
              <div className="print-brand-badge">
                <div className="print-brand-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M6 5v14M18 5v14M2 9h4M18 9h4M2 15h4M18 15h4M6 12h12" />
                  </svg>
                </div>
                <div>
                  <div className="print-brand-title">TREINOS // APP</div>
                  <div className="print-brand-sub">PRESCRIÇÃO & CIÊNCIA DO TREINAMENTO</div>
                </div>
              </div>
            )}

            <div className="print-trainer-details">
              <h1 className="print-trainer-name">{profissional?.nome || 'Personal Trainer'}</h1>
              <div className="print-trainer-cref">
                <span className="print-tag-pill">CREF: {profissional?.cref || 'REGISTRADO'}</span>
                <span className="print-trainer-role">{profissional?.profissao || 'Profissional de Educação Física'}</span>
              </div>
              <div className="print-trainer-contacts">
                {profissional?.telefone && (
                  <span className="print-contact-item"><strong>WhatsApp:</strong> {profissional.telefone}</span>
                )}
                {profissional?.instagram && (
                  <span className="print-contact-item"><strong>Instagram:</strong> @{profissional.instagram.replace('@', '')}</span>
                )}
              </div>
            </div>
          </div>

          <div className="print-header-stamp">
            <div className="print-stamp-title">BACKUP DIGITAL OFFLINE</div>
            <div className="print-stamp-item">
              <span className="print-stamp-label">PROTOCOLO:</span>
              <span className="print-stamp-value">#{String(protocolo.idProtocolo).padStart(4, '0')}</span>
            </div>
          </div>
        </header>

        {/* Protocol & Student Metadata Card */}
        <div className="print-meta-card">
          <div className="print-meta-cell">
            <span className="print-meta-label">ALUNO // PRONTUÁRIO</span>
            <span className="print-meta-val-primary">{aluno.nome}</span>
            {aluno.email && (
              <span className="print-meta-val-secondary">{aluno.email}</span>
            )}
          </div>

          <div className="print-meta-cell">
            <span className="print-meta-label">PROGRAMA // CICLO</span>
            <span className="print-meta-val-primary">{protocolo.nome}</span>
            <span className="print-meta-val-secondary">
              {protocolo.objetivo || 'Prescrição Técnica Geral'}
            </span>
          </div>

          <div className="print-meta-cell">
            <span className="print-meta-label">PERIODIZAÇÃO</span>
            <span className="print-meta-val-primary">
              {formatPrintDate(protocolo.dataInicio) || 'Início Imediato'}
              {protocolo.dataFim ? ` → ${formatPrintDate(protocolo.dataFim)}` : ' (Contínuo)'}
            </span>
            <span className="print-meta-val-secondary">
              {todasFichas.length} divisões cadastradas
            </span>
          </div>

          <div className="print-meta-cell">
            <span className="print-meta-label">VOLUME TOTAL</span>
            <span className="print-meta-val-primary">{totalSeriesProtocolo} Séries Totais</span>
            <span className="print-meta-val-secondary">
              {totalExerciciosProtocolo} Exercícios no Ciclo
            </span>
          </div>
        </div>

        {/* Workout Fichas */}
        {fichasImpressas.map((treino, idx) => {
          const isLast = idx === fichasImpressas.length - 1;
          const shouldBreakPage = paginaPorFicha && !isLast;
          const exercicios = porOrdem(treino.exercicios);
          const totalFichaSeries = exercicios.reduce((acc, e) => acc + (Number(e.series) || 0), 0);
          const fichaLetra = String.fromCharCode(65 + (treino.ordem ? treino.ordem - 1 : idx));

          return (
            <div
              key={treino.idTreino}
              className={`print-treino-block ${shouldBreakPage ? 'print-page-break' : ''}`}
            >
              <div className="print-treino-header">
                <div className="print-treino-title-wrap">
                  <span className="print-treino-badge">FICHA {fichaLetra}</span>
                  <h2 className="print-treino-title">{treino.nome}</h2>
                </div>
                <div className="print-treino-meta">
                  <span>{exercicios.length} EXERCÍCIOS</span>
                  <span>•</span>
                  <span>{totalFichaSeries} SÉRIES TOTAIS</span>
                </div>
              </div>

              {treino.observacao && (
                <div className="print-treino-callout">
                  <strong>ORIENTAÇÃO DA FICHA:</strong> {treino.observacao}
                </div>
              )}

              <table className="print-table">
                <thead>
                  <tr>
                    <th style={{ width: '32px', textAlign: 'center' }}>#</th>
                    <th style={{ width: '34%' }}>EXERCÍCIO & GRUPO</th>
                    <th style={{ width: '48px', textAlign: 'center' }}>SÉRIES</th>
                    <th style={{ width: '68px', textAlign: 'center' }}>REPS</th>
                    <th style={{ width: '64px', textAlign: 'center' }}>PAUSA</th>
                    <th>TÉCNICA & ORIENTAÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {exercicios.length > 0 ? (
                    exercicios.map((item, exIdx) => (
                      <tr key={item.idTreinoExercicio}>
                        <td className="print-td-num">{String(exIdx + 1).padStart(2, '0')}</td>
                        <td>
                          <div className="print-exercise-name">{item.exercicio.nome}</div>
                          <div className="print-exercise-group">{item.exercicio.grupoMuscular?.nome?.toUpperCase()}</div>
                        </td>
                        <td className="print-td-series">{item.series}</td>
                        <td className="print-td-reps">{item.repeticoes}</td>
                        <td className="print-td-descanso">
                          {formatDescanso(item.descansoSegundos || 60, item.descansoMaxSegundos)}
                        </td>
                        <td>
                          {item.tecnica && (
                            <span className="print-tecnica-tag">[{item.tecnica.nome.toUpperCase()}]</span>
                          )}
                          <span className="print-obs-text">{item.observacao || '—'}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '1.2rem', color: '#6b7280' }}>
                        Nenhum exercício prescrito nesta divisão.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {mostrarRodape && (
                <RodapeTreino texto={rodapeEfetivo(treino.rodape, profissional?.rodapeTreino)} variant="print" />
              )}
            </div>
          );
        })}

        <TabelaProgressao variant="print" />

        {/* Weekly volume by muscle group — extra summary page */}
        {volumeSemanalPorGrupo.length > 0 && (
          <div className="print-volume-page">
            <div className="print-treino-header">
              <div className="print-treino-title-wrap">
                <span className="print-treino-badge">RESUMO</span>
                <h2 className="print-treino-title">Volume Semanal por Grupo Muscular</h2>
              </div>
            </div>
            <p className="print-volume-subtitle">
              Total de séries prescritas por grupo muscular somando todas as fichas do protocolo — referência de distribuição de volume ao longo da semana.
            </p>
            <div className="print-volume-list">
              {volumeSemanalPorGrupo.map(([grupo, series]) => {
                const max = volumeSemanalPorGrupo[0][1];
                const pct = max > 0 ? Math.max((series / max) * 100, 6) : 0;
                return (
                  <div className="print-volume-row" key={grupo}>
                    <span className="print-volume-group-name">{grupo}</span>
                    <div className="print-volume-bar-track">
                      <div className="print-volume-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="print-volume-count">{series} séries</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Digital Offline Footer */}
        <footer className="print-footer">
          <div className="print-footer-left">
            <div className="print-footer-brand">
              <strong>TreinosApp</strong> • Prescrição Técnica Digital
            </div>
            <div className="print-footer-legal">
              Uso exclusivo de <strong>{aluno.nome}</strong> • Treinador: <strong>Prof. {profissional?.nome || 'Personal Trainer'}</strong> (CREF: {profissional?.cref || '—'})
            </div>
          </div>

          <div className="print-footer-right">
            <span className="print-footer-badge">VERSÃO OFFLINE // BACKUP</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
