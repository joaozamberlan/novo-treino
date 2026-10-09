import React, { useState } from 'react';
import { Check, HeartPulse, Info, X } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import {
  CARDIO_MODELOS,
  MAX_CARDIO_MINUTOS,
  modeloCardio,
  parseMinutosCardio,
  type CardioModelo,
} from '../utils/cardio';

// ── Treinador: tipo + minutos no formulário da ficha ────────────────────────

interface CardioCamposProps {
  idPrefix: string;
  tipo: string;
  minutos: string;
  onChange: (tipo: string, minutos: string) => void;
}

export const CardioCampos: React.FC<CardioCamposProps> = ({ idPrefix, tipo, minutos, onChange }) => {
  const modelo = modeloCardio(tipo);
  const valor = parseMinutosCardio(minutos);
  const foraDaFaixa =
    !!modelo?.faixa && valor !== null && (valor < modelo.faixa[0] || valor > modelo.faixa[1]);

  return (
    <div className="form-group">
      <label className="form-label" htmlFor={`${idPrefix}CardioTipo`}>Aeróbico (opcional)</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <select
          id={`${idPrefix}CardioTipo`}
          className="form-input"
          style={{ flex: 1, minWidth: 0 }}
          value={tipo}
          onChange={(e) => {
            const novo = modeloCardio(e.target.value);
            onChange(e.target.value, novo?.minutosSugeridos ? String(novo.minutosSugeridos) : '');
          }}
        >
          <option value="">Sem aeróbico</option>
          {CARDIO_MODELOS.map((m) => (
            <option key={m.tipo} value={m.tipo}>{m.nome}</option>
          ))}
        </select>
        {modelo && (
          <div className="set-input-wrap" style={{ width: '110px', flexShrink: 0 }}>
            <input
              id={`${idPrefix}CardioMinutos`}
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_CARDIO_MINUTOS}
              className="form-input"
              style={{ paddingRight: '2.2rem' }}
              placeholder="0"
              value={minutos}
              onChange={(e) => onChange(tipo, e.target.value)}
              aria-label="Minutos de aeróbico"
            />
            <span className="set-input-unit">min</span>
          </div>
        )}
      </div>
      {modelo && (
        <p style={{ fontSize: '0.75rem', color: 'var(--text-1)', lineHeight: 1.45, margin: '0.4rem 0 0' }}>
          {modelo.comoFazer(valor)}
          {foraDaFaixa && modelo.faixa && (
            <strong style={{ display: 'block', marginTop: '0.25rem', color: 'var(--accent-text)' }}>
              A duração usual deste modelo é de {modelo.faixa[0]} a {modelo.faixa[1]} minutos.
            </strong>
          )}
        </p>
      )}
    </div>
  );
};

// ── Aluno: nome do tipo que abre a explicação do modelo ─────────────────────

const CardioTipoBotao: React.FC<{ modelo: CardioModelo; minutos: number }> = ({ modelo, minutos }) => {
  const [aberto, setAberto] = useState(false);
  const idTitulo = `cardioInfo-${modelo.tipo}`;

  return (
    <>
      <button
        type="button"
        className="badge badge-accent"
        onClick={() => setAberto(true)}
        style={{ gap: '0.3rem', minHeight: '32px', padding: '0 0.6rem', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', border: 'none' }}
        aria-label={`${modelo.nome}: ver como funciona`}
        title="Ver como funciona"
      >
        {modelo.nome}
        <Info size={13} aria-hidden="true" />
      </button>

      {aberto && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setAberto(false)} role="dialog" aria-modal="true" aria-labelledby={idTitulo}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
              <div className="modal-header">
                <h3 id={idTitulo} style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  {modelo.nome}
                </h3>
                <button type="button" className="modal-close" onClick={() => setAberto(false)} title="Fechar" aria-label="Fechar">
                  <X size={18} />
                </button>
              </div>

              <p style={{ fontSize: '0.9rem', color: 'var(--text-0)', lineHeight: 1.55, margin: 0 }}>
                {modelo.comoFazer(minutos)}
              </p>

              {modelo.detalhes.length > 0 && (
                <dl style={{ margin: '1rem 0 0', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {modelo.detalhes.map((d) => (
                    <div key={d.rotulo}>
                      <dt style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {d.rotulo}
                      </dt>
                      <dd style={{ margin: '0.1rem 0 0', fontSize: '0.85rem', color: 'var(--text-1)', lineHeight: 1.45 }}>
                        {d.texto}
                      </dd>
                    </div>
                  ))}
                </dl>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setAberto(false)}
                style={{ width: '100%', height: '44px', marginTop: '1.25rem' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

// ── Aluno: aviso fixo no topo da ficha (só leitura) ─────────────────────────

export const CardioCabecalho: React.FC<{ modelo: CardioModelo; minutos: number }> = ({ modelo, minutos }) => (
  <div className="card" style={{ padding: '0.7rem 1rem', marginBottom: '1rem', backgroundColor: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
      <HeartPulse size={15} style={{ color: 'var(--accent-text)', flexShrink: 0 }} aria-hidden="true" />
      <span style={{ fontSize: '0.8rem', color: 'var(--text-0)' }}>
        Aeróbico pós-treino: <strong>{minutos} min</strong>
      </span>
      <CardioTipoBotao modelo={modelo} minutos={minutos} />
    </div>
  </div>
);

// ── Aluno: registro no fim da ficha, depois dos exercícios ──────────────────

interface CardioRegistroProps {
  modelo: CardioModelo;
  minutosPrescritos: number;
  // Minutos feitos; começa com o prescrito e o aluno pode mudar
  minutos: string;
  feito: boolean;
  onMinutos: (valor: string) => void;
  onConfirmarMinutos: () => void;
  onAlternar: () => void;
}

export const CardioRegistro: React.FC<CardioRegistroProps> = ({
  modelo,
  minutosPrescritos,
  minutos,
  feito,
  onMinutos,
  onConfirmarMinutos,
  onAlternar,
}) => (
  <div className={`exercise-tactile-card ${feito ? 'completed' : ''}`} style={{ marginTop: '1rem' }}>
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
      AERÓBICO
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '1.025rem', fontWeight: 700, color: 'var(--text-0)', letterSpacing: '-0.02em', textDecoration: feito ? 'line-through' : 'none' }}>
        Cardio pós-treino
      </span>
      <CardioTipoBotao modelo={modelo} minutos={minutosPrescritos} />
      {feito && (
        <span className="badge badge-success" style={{ fontSize: '0.65rem', height: '18px', padding: '0 0.45rem' }}>
          Feito ✓
        </span>
      )}
    </div>

    <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', marginTop: '0.75rem', padding: '0.35rem 0.6rem', backgroundColor: 'var(--bg-2)', borderRadius: 'var(--radius-s)' }}>
      Meta prescrita: <strong>{minutosPrescritos} min</strong>
    </div>

    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginTop: '0.75rem' }}>
      <label htmlFor="cardioMinutosFeitos" style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>
        Quanto você fez
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div className="set-input-wrap" style={{ width: '96px' }}>
          <input
            id="cardioMinutosFeitos"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_CARDIO_MINUTOS}
            className="set-input"
            style={{ paddingRight: '1.9rem' }}
            value={minutos}
            onChange={(e) => onMinutos(e.target.value)}
            onBlur={onConfirmarMinutos}
          />
          <span className="set-input-unit">min</span>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={feito}
          aria-label="Marcar aeróbico como feito"
          onClick={onAlternar}
          className={`set-check-btn ${feito ? 'completed' : ''}`}
          title={feito ? 'Desmarcar aeróbico' : 'Marcar aeróbico como feito'}
        >
          {feito ? (
            <Check size={18} strokeWidth={3} className="check-pop-icon" aria-hidden="true" />
          ) : (
            <div style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid var(--border-strong)' }} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  </div>
);
