import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Check, Timer, Video, Info, ChevronDown, ChevronUp, 
  Sparkles, ArrowLeft 
} from 'lucide-react';
import './picker.css';

// ── Variant 1: Tactile iOS (Apple Design Physics) ──────────────────────────
const VariantTactileIOS: React.FC = () => {
  const [completed, setCompleted] = useState(false);
  const [timerActive, setTimerActive] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [loadKg, setLoadKg] = useState(80);

  useEffect(() => {
    let timer: any;
    if (timerActive && secondsLeft > 0) {
      timer = setInterval(() => setSecondsLeft(s => s - 1), 1000);
    } else if (secondsLeft === 0) {
      setTimerActive(false);
      setSecondsLeft(60);
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    }
    return () => clearInterval(timer);
  }, [timerActive, secondsLeft]);

  const handleToggle = () => {
    if ('vibrate' in navigator) navigator.vibrate(15);
    setCompleted(prev => !prev);
  };

  const handleTimer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if ('vibrate' in navigator) navigator.vibrate(10);
    setSecondsLeft(60);
    setTimerActive(true);
  };

  return (
    <div 
      className="card"
      style={{
        padding: '1.25rem',
        backgroundColor: completed ? 'rgba(18, 183, 106, 0.04)' : 'var(--bg-1)',
        border: completed ? '1px solid rgba(18, 183, 106, 0.3)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-l)',
        boxShadow: completed ? '0 8px 24px rgba(18, 183, 106, 0.08)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'all 240ms var(--ease-spring)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Large Tactile 48px iOS Check Button */}
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-label={completed ? "Desmarcar Supino Reto com Barra" : "Concluir Supino Reto com Barra"}
          onClick={handleToggle}
          className={`exercise-check-btn ${completed ? 'completed' : ''}`}
          style={{ width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', borderRadius: '50%' }}
        >
          {completed ? (
            <Check size={24} strokeWidth={3} className="check-pop-icon" aria-hidden="true" />
          ) : (
            <div style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--border-strong)' }} aria-hidden="true" />
          )}
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ 
              fontSize: '1.05rem', 
              fontWeight: 700, 
              color: 'var(--text-0)', 
              letterSpacing: '-0.02em',
              textDecoration: completed ? 'line-through' : 'none' 
            }}>
              Supino Reto com Barra
            </span>
            {completed && (
              <span className="badge badge-success" style={{ fontSize: '0.65rem', height: '20px' }}>
                Feito
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span className="exercise-block-tag" style={{ background: 'var(--bg-2)', color: 'var(--text-1)' }}>Peitoral Maior</span>
            <span className="exercise-block-tag" style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}>Cadência 3010</span>
          </div>
        </div>
      </div>

      {/* Inline Pro Compact Controls Row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '1rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid var(--border)',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-1)', fontWeight: 600 }}>Carga:</span>
          <div className="load-stepper">
            <button
              type="button"
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(10);
                setLoadKg(w => Math.max(0, w - 5));
              }}
              className="load-stepper-btn"
              aria-label="Diminuir 5kg"
            >-</button>
            <span className="load-stepper-value">{loadKg}kg</span>
            <button
              type="button"
              onClick={() => {
                if ('vibrate' in navigator) navigator.vibrate(10);
                setLoadKg(w => w + 5);
              }}
              className="load-stepper-btn"
              aria-label="Aumentar 5kg"
            >+</button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            4<span style={{ color: 'var(--text-2)', fontSize: '0.8rem', margin: '0 2px' }}>×</span>10
          </span>
          <button
            type="button"
            className="rest-timer-trigger"
            onClick={handleTimer}
            aria-label="Iniciar 60s descanso"
          >
            <Timer size={12} aria-hidden="true" />
            <span>{timerActive ? `${secondsLeft}s` : '60s'}</span>
          </button>
        </div>
      </div>

      {timerActive && (
        <div style={{
          marginTop: '0.85rem',
          padding: '0.5rem 0.75rem',
          borderRadius: 'var(--radius-s)',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          animation: 'fadeIn 180ms var(--ease-out)'
        }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>Descansando entre séries...</span>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--accent)' }}>{secondsLeft}s</span>
        </div>
      )}
    </div>
  );
};

// ── Variant 2: Multi-Set Chips (Granular Set Tracker) ──────────────────────
const VariantMultiSetChips: React.FC = () => {
  const [completedSets, setCompletedSets] = useState<number[]>([1, 2]);
  const totalSets = 4;

  const toggleSet = (setNumber: number) => {
    if ('vibrate' in navigator) navigator.vibrate(12);
    setCompletedSets(prev => 
      prev.includes(setNumber) ? prev.filter(s => s !== setNumber) : [...prev, setNumber]
    );
  };

  const isAllDone = completedSets.length === totalSets;

  return (
    <div 
      className="card"
      style={{
        padding: '1.25rem',
        backgroundColor: 'var(--bg-1)',
        border: isAllDone ? '1px solid var(--success)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-l)',
        boxShadow: isAllDone ? '0 0 20px rgba(18, 183, 106, 0.12)' : '0 4px 16px rgba(0, 0, 0, 0.2)',
        transition: 'all 240ms var(--ease-out)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
            Puxada Alta Frente
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            <span className="exercise-block-tag">Dorsais</span>
            <span className="exercise-block-tag" style={{ color: 'var(--warning)', background: 'rgba(245, 158, 11, 0.1)' }}>Drop-set final</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-1)', display: 'block' }}>Progresso</span>
          <span style={{ fontSize: '0.95rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: isAllDone ? 'var(--success)' : 'var(--accent)' }}>
            {completedSets.length} / {totalSets} séries
          </span>
        </div>
      </div>

      {/* Granular Set Pills */}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
        {Array.from({ length: totalSets }, (_, i) => i + 1).map(setNumber => {
          const done = completedSets.includes(setNumber);
          return (
            <button
              key={setNumber}
              type="button"
              onClick={() => toggleSet(setNumber)}
              aria-label={`Série ${setNumber}: ${done ? 'Concluída' : 'Pendente'}`}
              style={{
                flex: 1,
                minHeight: '44px',
                borderRadius: 'var(--radius-m)',
                border: done ? '1.5px solid var(--success)' : '1px solid var(--border)',
                background: done ? 'rgba(18, 183, 106, 0.16)' : 'var(--bg-2)',
                color: done ? 'var(--success)' : 'var(--text-1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 160ms var(--ease-spring)',
                touchAction: 'manipulation'
              }}
            >
              <span style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase' }}>Set {setNumber}</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                {done ? '✓ Feito' : '12 reps'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Variant 3: Pro Compact (Linear / Athletic Minimalist) ──────────────────
const VariantProCompact: React.FC = () => {
  const [loadKg, setLoadKg] = useState(100);
  const [reps, setReps] = useState(8);
  const [checked, setChecked] = useState(false);

  return (
    <div 
      className="card"
      style={{
        padding: '0.75rem 1rem',
        backgroundColor: checked ? 'var(--bg-2)' : 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-m)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '0.75rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
        <button
          type="button"
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(10);
            setChecked(!checked);
          }}
          className={`exercise-check-btn ${checked ? 'completed' : ''}`}
          style={{ width: '38px', height: '38px', minWidth: '38px', minHeight: '38px' }}
          aria-label={checked ? "Desmarcar Agachamento" : "Concluir Agachamento"}
        >
          {checked ? <Check size={18} strokeWidth={2.8} className="check-pop-icon" /> : null}
        </button>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            Agachamento Livre
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>Quadríceps & Glúteos • 90s rest</div>
        </div>
      </div>

      {/* Inline Quick Load & Rep Adjusters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {/* Load (kg) adjuster */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--bg-3)', 
          borderRadius: 'var(--radius-s)',
          padding: '2px 6px',
          border: '1px solid var(--border)'
        }}>
          <button 
            type="button" 
            onClick={() => setLoadKg(w => Math.max(0, w - 5))} 
            style={{ border: 0, background: 'transparent', color: 'var(--text-1)', cursor: 'pointer', padding: '0 4px', minHeight: '28px' }}
            aria-label="Diminuir 5kg"
          >-</button>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '46px', textAlign: 'center', fontVariantNumeric: 'tabular-nums' }}>
            {loadKg}kg
          </span>
          <button 
            type="button" 
            onClick={() => setLoadKg(w => w + 5)} 
            style={{ border: 0, background: 'transparent', color: 'var(--text-1)', cursor: 'pointer', padding: '0 4px', minHeight: '28px' }}
            aria-label="Aumentar 5kg"
          >+</button>
        </div>

        {/* Reps adjuster */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'var(--bg-3)', 
          borderRadius: 'var(--radius-s)',
          padding: '2px 6px',
          border: '1px solid var(--border)'
        }}>
          <button 
            type="button" 
            onClick={() => setReps(r => Math.max(1, r - 1))} 
            style={{ border: 0, background: 'transparent', color: 'var(--text-1)', cursor: 'pointer', padding: '0 4px', minHeight: '28px' }}
            aria-label="Diminuir 1 repetição"
          >-</button>
          <span style={{ fontSize: '0.85rem', fontWeight: 800, minWidth: '38px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', color: 'var(--text-0)' }}>
            {reps} reps
          </span>
          <button 
            type="button" 
            onClick={() => setReps(r => r + 1)} 
            style={{ border: 0, background: 'transparent', color: 'var(--text-1)', cursor: 'pointer', padding: '0 4px', minHeight: '28px' }}
            aria-label="Aumentar 1 repetição"
          >+</button>
        </div>
      </div>
    </div>
  );
};

// ── Variant 4: Media-Forward (Biomechanics & Technique) ────────────────────
const VariantMediaForward: React.FC = () => {
  const [expanded, setExpanded] = useState(true);
  const [completed, setCompleted] = useState(false);

  return (
    <div 
      className="card"
      style={{
        padding: '1.25rem',
        backgroundColor: 'var(--bg-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-l)',
        boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)'
      }}
    >
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        {/* Visual Video Thumbnail Preview */}
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: 'var(--radius-m)',
          backgroundColor: 'var(--bg-2)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          cursor: 'pointer'
        }}>
          <Video size={22} color="var(--accent)" />
          <span style={{ fontSize: '0.6rem', color: 'var(--text-1)', marginTop: '2px', fontWeight: 600 }}>0:45</span>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Elevação Lateral Halteres</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', marginTop: '0.15rem' }}>Deltoide Lateral</div>
            </div>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>
              3×15
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                border: 'none',
                background: 'transparent',
                color: 'var(--text-1)',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <Info size={14} />
              <span>Instruções biomecânicas</span>
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div style={{
          marginTop: '0.85rem',
          padding: '0.75rem',
          borderRadius: 'var(--radius-m)',
          backgroundColor: 'var(--bg-2)',
          border: '1px solid var(--border)',
          fontSize: '0.8rem',
          color: 'var(--text-0)',
          lineHeight: 1.5,
          animation: 'fadeIn 180ms var(--ease-out)'
        }}>
          💡 <strong>Dica de execução:</strong> Mantenha ligeira inclinação do tronco à frente e cotovelos semiflexionados. Conduza o movimento pelo cotovelo, sem encolher os ombros.
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
        <button
          type="button"
          className="rest-timer-trigger"
          onClick={() => { if ('vibrate' in navigator) navigator.vibrate(10); }}
        >
          <Timer size={12} />
          <span>45s descanso</span>
        </button>

        <button
          type="button"
          onClick={() => {
            if ('vibrate' in navigator) navigator.vibrate(15);
            setCompleted(!completed);
          }}
          className={`btn ${completed ? 'btn-secondary' : 'btn-primary'}`}
          style={{ height: '36px', minWidth: '120px' }}
        >
          {completed ? '✓ Concluído' : 'Marcar Série'}
        </button>
      </div>
    </div>
  );
};

// ── Full Prototype Harness (with Verbatim PICKER.md Integration) ────────────
export const ExerciseCardPrototype: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const variants = [
    { name: 'Tactile iOS', component: <VariantTactileIOS /> },
    { name: 'Multi-Set Chips', component: <VariantMultiSetChips /> },
    { name: 'Pro Compact', component: <VariantProCompact /> },
    { name: 'Media-Forward', component: <VariantMediaForward /> },
  ];

  const initialIndex = Math.min(
    Math.max(parseInt(searchParams.get('v') || '1', 10) - 1, 0),
    variants.length - 1
  );

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [remountKey, setRemountKey] = useState(0);
  const pickerRef = useRef<HTMLElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const moveHighlight = (index: number) => {
    const btn = buttonsRef.current[index];
    const highlight = highlightRef.current;
    if (btn && highlight) {
      highlight.style.width = `${btn.offsetWidth}px`;
      highlight.style.transform = `translateX(${btn.offsetLeft}px)`;
    }
  };

  const selectVariant = (index: number) => {
    if (index < 0 || index >= variants.length) return;
    setActiveIndex(index);
    setRemountKey(k => k + 1);
    setSearchParams({ v: String(index + 1) });
    moveHighlight(index);
  };

  const replayCurrent = () => {
    setRemountKey(k => k + 1);
  };

  // Keyboard navigation contract from PICKER.md (1-N, Arrows, R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test((e.target as HTMLElement).tagName) || (e.target as HTMLElement).isContentEditable) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= variants.length) {
        selectVariant(num - 1);
      } else if (e.key === 'ArrowRight') {
        selectVariant((activeIndex + 1) % variants.length);
      } else if (e.key === 'ArrowLeft') {
        selectVariant((activeIndex - 1 + variants.length) % variants.length);
      } else if (e.key === 'r' || e.key === 'R') {
        replayCurrent();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeIndex]);

  // Initial highlight position without animation, then enable data-ready
  useEffect(() => {
    moveHighlight(activeIndex);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        pickerRef.current?.setAttribute('data-ready', '');
      });
    });
    return () => cancelAnimationFrame(id);
  }, [activeIndex]);

  return (
    <div style={{ minHeight: '100dvh', backgroundColor: 'var(--bg-0)', color: 'var(--text-0)', paddingBottom: '6rem' }}>
      
      {/* Harness Top Navigation Bar */}
      <div style={{
        backgroundColor: 'var(--bg-1)',
        borderBottom: '1px solid var(--border)',
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-secondary btn-sm"
            aria-label="Voltar para o app"
          >
            <ArrowLeft size={14} /> Voltar
          </button>
          <div>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={14} color="var(--accent)" />
              <span>Protótipo: Exercise Card (Variações 1–4)</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>
              Use o seletor visual ou as teclas <strong>1–4</strong>, <strong>←/→</strong> e <strong>R</strong> para testar.
            </div>
          </div>
        </div>
      </div>

      {/* Realistic Gym Surrounding Context */}
      <main style={{ maxWidth: '540px', margin: '2rem auto 0 auto', padding: '0 1rem' }}>
        
        {/* Context: Workout Header */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>Ficha Ativa</span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>João da Silva</span>
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
            Treino A — Peito & Ombros
          </h1>
        </div>

        {/* Ficha Tabs Context */}
        <div className="ficha-tabs" style={{ marginBottom: '1.5rem' }}>
          <button className="ficha-tab active">A (Peitoral)</button>
          <button className="ficha-tab">B (Dorsais)</button>
          <button className="ficha-tab">C (Pernas)</button>
        </div>

        {/* The Active Variant Preview Stage (Re-mounted on switch) */}
        <div key={remountKey} style={{ marginBottom: '2rem' }}>
          <div style={{ 
            fontSize: '0.75rem', 
            textTransform: 'uppercase', 
            letterSpacing: '0.05em', 
            color: 'var(--accent)', 
            fontWeight: 700, 
            marginBottom: '0.5rem' 
          }}>
            Variação Ativa: {variants[activeIndex].name}
          </div>
          {variants[activeIndex].component}
        </div>

        {/* Context: Next Exercise Sibling */}
        <div style={{ opacity: 0.45 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', marginBottom: '0.4rem', fontWeight: 600 }}>
            Próximo na sequência:
          </div>
          <div className="exercise-block">
            <div className="exercise-check-btn">
              <div style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid var(--border)' }} />
            </div>
            <div className="exercise-block-info">
              <div className="exercise-block-name">Crucifixo Inclinado com Halteres</div>
              <div className="exercise-block-detail">
                <span className="exercise-block-tag">Peitoral Superior</span>
              </div>
            </div>
            <div className="exercise-block-stats">
              <span className="exercise-block-stat">3×12</span>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Picker Harness (Verbatim PICKER.md markup & styles) */}
      <nav className="proto-picker" ref={pickerRef} aria-label="Prototype variants">
        <span className="proto-picker-highlight" ref={highlightRef} aria-hidden="true" />
        {variants.map((v, i) => (
          <button
            key={v.name}
            ref={el => { buttonsRef.current[i] = el; }}
            className="proto-picker-item"
            data-active={activeIndex === i ? true : undefined}
            aria-current={activeIndex === i ? 'true' : undefined}
            onClick={() => selectVariant(i)}
          >
            {v.name}
          </button>
        ))}
        <span className="proto-picker-divider" aria-hidden="true" />
        <button 
          className="proto-picker-item proto-picker-replay" 
          aria-label="Replay animation (R)"
          onClick={replayCurrent}
          title="Repetir animação (R)"
        >
          ↻
        </button>
      </nav>
    </div>
  );
};
