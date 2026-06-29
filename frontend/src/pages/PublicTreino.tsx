import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Dumbbell, Award, Phone, Video, 
  Timer, Check, RefreshCw, AlertCircle, Sun, Moon 
} from 'lucide-react';

const InstagramIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

interface GrupoMuscular {
  nome: string;
}

interface Exercicio {
  nome: string;
  videoUrl?: string;
  grupoMuscular: GrupoMuscular;
}

interface TecnicaTreino {
  nome: string;
  descricao?: string;
}

interface PrescribedExercise {
  idTreinoExercicio: number;
  series: number;
  repeticoes: string;
  descansoSegundos?: number;
  observacao?: string;
  exercicio: Exercicio;
  tecnica?: TecnicaTreino;
}

interface FichaTreino {
  idTreino: number;
  nome: string;
  observacao?: string;
  exercicios: PrescribedExercise[];
}

interface Protocolo {
  idProtocolo: number;
  nome: string;
  objetivo?: string;
}

interface Profissional {
  nome: string;
  cref: string;
  profissao: string;
  telefone?: string;
  instagram?: string;
  logoUrl?: string;
}

interface PublicData {
  aluno: { nome: string };
  profissional: Profissional;
  protocolo: (Protocolo & { treinos: FichaTreino[] }) | null;
}

export const PublicTreino: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Completed exercises local state
  const [completedList, setCompletedList] = useState<Record<number, boolean>>({});

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'dark';
  });

  // Toggle theme class on body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // Timer states
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);

  useEffect(() => {
    const fetchPublicData = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await api.get(`/publico/treinos/${token}`);
        setData(res.data);
        
        const treinos = res.data.protocolo?.treinos || [];
        if (treinos.length > 0) {
          const sorted = [...treinos].sort((a: any, b: any) => a.ordem - b.ordem);
          setActiveTabId(sorted[0].idTreino);
        }
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data?.message || 'Ficha de treino não encontrada ou expirada.');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchPublicData();
    }
  }, [token]);

  useEffect(() => {
    if (data?.aluno) {
      document.title = `Treino: ${data.aluno.nome} | TreinosApp`;
    } else {
      document.title = 'Ficha de Treino | TreinosApp';
    }
  }, [data]);

  // Countdown timer logic
  useEffect(() => {
    let interval: any;
    if (timerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerRunning) {
      setTimerRunning(false);
      setTimerDuration(null);
      // Play a subtle sound or vibrate if supported
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
      } catch (e) {
        console.log('Audio Context block:', e);
      }
    }
    return () => clearInterval(interval);
  }, [timerRunning, timeLeft]);

  const startTimer = (seconds: number) => {
    setTimeLeft(seconds);
    setTimerDuration(seconds);
    setTimerRunning(true);
  };

  const stopTimer = () => {
    setTimerRunning(false);
    setTimerDuration(null);
    setTimeLeft(0);
  };

  const toggleExerciseCompleted = (id: number) => {
    setCompletedList(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', backgroundColor: 'var(--bg-0)', color: 'var(--text-1)' }}>
        <RefreshCw className="animate-spin" size={24} />
        <span>Carregando sua ficha de treinos...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', gap: '1rem', backgroundColor: 'var(--bg-0)', textAlign: 'center' }}>
        <AlertCircle size={40} className="text-danger" />
        <h1>Erro no Acesso</h1>
        <p style={{ maxWidth: '400px' }}>{error || 'Link de treino inválido ou expirado. Verifique com seu Personal Trainer.'}</p>
      </div>
    );
  }

  const { aluno, profissional, protocolo } = data;
  const activeFicha = protocolo?.treinos.find(t => t.idTreino === activeTabId);
  const sortedTreinos = protocolo?.treinos ? [...protocolo.treinos].sort((a: any, b: any) => a.ordem - b.ordem) : [];
  const sortedExercicios = activeFicha?.exercicios ? [...activeFicha.exercicios].sort((a: any, b: any) => a.ordem - b.ordem) : [];

  const calculateVolume = () => {
    if (!protocolo?.treinos) return {};
    const volumeMap: Record<string, number> = {};
    protocolo.treinos.forEach(treino => {
      if (treino.exercicios) {
        treino.exercicios.forEach(item => {
          const grupo = item.exercicio.grupoMuscular.nome;
          volumeMap[grupo] = (volumeMap[grupo] || 0) + item.series;
        });
      }
    });
    return volumeMap;
  };

  const volume = calculateVolume();

  return (
    <div className="animate-in" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-0)', color: 'var(--text-0)', paddingBottom: '5rem' }}>
      
      {/* Personal Trainer Branding Header */}
      <header style={{ backgroundColor: 'var(--bg-1)', borderBottom: '1px solid var(--border)', padding: '1rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {profissional.logoUrl ? (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
              <img src={profissional.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0, color: 'var(--accent)' }}>
              <Dumbbell size={20} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profissional.nome}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.1rem' }}>
              <Award size={12} className="text-accent" />
              <span>{profissional.profissao} · CREF {profissional.cref}</span>
            </div>
          </div>
          
          {/* Contact shortcuts */}
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button 
              onClick={toggleTheme} 
              className="topbar-btn" 
              style={{ width: '32px', height: '32px' }} 
              title={theme === 'dark' ? "Ativar modo claro" : "Ativar modo escuro"}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            {profissional.telefone && (
              <a href={`https://wa.me/55${profissional.telefone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="topbar-btn" style={{ width: '32px', height: '32px' }} title="WhatsApp">
                <Phone size={14} />
              </a>
            )}
            {profissional.instagram && (
              <a href={`https://instagram.com/${profissional.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="topbar-btn" style={{ width: '32px', height: '32px' }} title="Instagram">
                <InstagramIcon width={14} height={14} />
              </a>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '1.25rem auto 0 auto', padding: '0 1rem' }}>
        
        {/* Student welcome & Active protocol details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-1)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Olá, {aluno.nome.split(' ')[0]} 👋
          </span>
          <h1 style={{ fontSize: '1.25rem', marginTop: '0.2rem', marginBottom: '0.25rem' }}>
            {protocolo?.nome || 'Ficha de Treinos'}
          </h1>
          {protocolo?.objetivo && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>
              Foco: {protocolo.objetivo}
            </p>
          )}
        </div>

        {protocolo ? (
          <>
            {/* Training Tabs */}
            <div className="ficha-tabs" style={{ marginBottom: '1.25rem' }}>
              {sortedTreinos.map((treino) => (
                <button
                  key={treino.idTreino}
                  className={`ficha-tab ${activeTabId === treino.idTreino ? 'active' : ''}`}
                  onClick={() => setActiveTabId(treino.idTreino)}
                  style={{ flex: 1, textAlign: 'center', padding: '0.6rem 0' }}
                >
                  {treino.nome.replace('Treino ', '')}
                </button>
              ))}
            </div>

            {/* Ficha Observation */}
            {activeFicha?.observacao && (
              <div className="card" style={{ padding: '0.75rem 1rem', marginBottom: '1rem', backgroundColor: 'var(--bg-1)', borderLeft: '3px solid var(--accent)' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-0)', lineHeight: '1.4' }}>
                  {activeFicha.observacao}
                </p>
              </div>
            )}

            {/* Exercises List */}
            <div className="exercise-stack">
              {sortedExercicios.length > 0 ? (
                sortedExercicios.map((item) => {
                  const isCompleted = !!completedList[item.idTreinoExercicio];
                  return (
                    <div 
                      key={item.idTreinoExercicio} 
                      className="exercise-block" 
                      style={{ 
                        opacity: isCompleted ? 0.5 : 1, 
                        transition: 'opacity var(--transition)',
                        padding: '0.75rem'
                      }}
                    >
                      {/* Interactive complete checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleExerciseCompleted(item.idTreinoExercicio)}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '6px',
                          border: isCompleted ? '1px solid var(--success)' : '1px solid var(--border)',
                          background: isCompleted ? 'rgba(18, 183, 106, 0.1)' : 'transparent',
                          color: 'var(--success)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}
                        title={isCompleted ? "Desmarcar conclusão" : "Marcar conclusão"}
                      >
                        {isCompleted && <Check size={16} />}
                      </button>

                      <div className="exercise-block-info" style={{ minWidth: 0 }}>
                        <div className="exercise-block-name" style={{ fontSize: '0.9rem', textDecoration: isCompleted ? 'line-through' : 'none' }}>
                          {item.exercicio.nome}
                        </div>
                        <div className="exercise-block-detail" style={{ marginTop: '0.2rem' }}>
                          <span className="exercise-block-tag">{item.exercicio.grupoMuscular.nome}</span>
                          {item.tecnica && <span className="exercise-block-tag" style={{ color: 'var(--accent)' }}>{item.tecnica.nome}</span>}
                          {item.observacao && <span style={{ color: 'var(--text-1)', fontStyle: 'italic' }}>{item.observacao}</span>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                        {/* Stats layout */}
                        <div className="exercise-block-stats" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '0.1rem' }}>
                          <span className="exercise-block-stat" style={{ fontSize: '0.85rem' }}>
                            {item.series}<span className="exercise-block-stat-label">×</span>{item.repeticoes}
                          </span>
                          
                          {/* Timer triggers */}
                          {item.descansoSegundos && (
                            <button
                              type="button"
                              className="badge badge-accent"
                              onClick={() => startTimer(item.descansoSegundos!)}
                              style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.2rem', 
                                cursor: 'pointer',
                                border: 'none',
                                background: 'rgba(204, 255, 0, 0.06)',
                                fontFamily: 'var(--font)',
                                height: '18px'
                              }}
                              title="Iniciar tempo de descanso"
                            >
                              <Timer size={10} />
                              <span>{item.descansoSegundos}s</span>
                            </button>
                          )}
                        </div>

                        {/* Video executor link */}
                        {item.exercicio.videoUrl && (
                          <a
                            href={item.exercicio.videoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="exercise-action-btn accent"
                            style={{ display: 'flex' }}
                            title="Ver vídeo explicativo"
                          >
                            <Video size={16} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
                  Nenhum exercício prescrito nesta ficha.
                </div>
              )}
            </div>

            {/* Volume Summary */}
            {Object.keys(volume).length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <span style={{ color: 'var(--text-1)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                  Volume Semanal do Programa:
                </span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {Object.entries(volume).map(([grupo, series]) => (
                    <span 
                      key={grupo} 
                      className="badge" 
                      style={{ 
                        backgroundColor: 'var(--bg-1)', 
                        border: '1px solid var(--border)', 
                        color: 'var(--text-0)',
                        fontSize: '0.7rem',
                        height: '22px',
                        padding: '0 0.6rem',
                        textTransform: 'none',
                        letterSpacing: 'normal'
                      }}
                    >
                      {grupo}: <span style={{ color: 'var(--accent)', fontWeight: 600, marginLeft: '0.25rem' }}>{series} {series === 1 ? 'série' : 'séries'}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
            Nenhum treino ativo disponível. Fale com seu treinador.
          </div>
        )}
      </main>

      {/* Floating countdown rest timer overlay */}
      {timerDuration !== null && (
        <div style={{
          position: 'fixed',
          bottom: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 2rem)',
          maxWidth: '560px',
          height: '56px',
          backgroundColor: 'var(--bg-1)',
          border: '1px solid var(--accent)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.25rem',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
          zIndex: 200,
          animation: 'fadeIn 0.2s ease forwards'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Timer size={18} className="text-accent animate-pulse" />
            <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>Tempo de Descanso</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--accent)' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <button 
              onClick={stopTimer} 
              className="btn btn-secondary btn-sm"
              style={{ height: '28px', fontSize: '0.75rem' }}
            >
              Parar
            </button>
          </div>

          {/* Progress bar background indicator */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            height: '3px',
            backgroundColor: 'var(--accent)',
            width: `${(timeLeft / timerDuration) * 100}%`,
            transition: 'width 1s linear',
            borderRadius: '0 0 12px 12px'
          }} />
        </div>
      )}
    </div>
  );
};
