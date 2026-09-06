import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Dumbbell, Award, Phone, Video, 
  Timer, Check, RefreshCw, AlertCircle, Sun, Moon, Info,
  History, RotateCcw, TrendingUp, Trophy, Flag, Sparkles
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
  carga?: string;
  descansoSegundos?: number;
  observacao?: string;
  exercicio: Exercicio;
  tecnica?: TecnicaTreino;
}

interface FichaTreino {
  idTreino: number;
  nome: string;
  observacao?: string;
  ordem: number;
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

interface ExerciseSetEntry {
  setNumber: number;
  kg: string;
  reps: string;
  completed: boolean;
}

interface PreviousSetRecord {
  numeroSerie: number;
  cargaKg: number | null;
  repeticoes: number | null;
}

interface HistoricoAnterior {
  data: string;
  exercicios: Record<number, PreviousSetRecord[]>;
}

const formatDataPtBr = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [ano, mes, dia] = parts;
  return `${dia}/${mes}/${ano.slice(2)}`;
};

const getDiasAtras = (dateStr: string) => {
  try {
    const dataAnterior = new Date(dateStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const diffMs = hoje.getTime() - dataAnterior.getTime();
    const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
    if (diffDias === 0) return 'hoje';
    if (diffDias === 1) return 'ontem';
    if (diffDias === 7) return 'há 1 semana';
    if (diffDias > 0) return `há ${diffDias} dias`;
    return '';
  } catch {
    return '';
  }
};

export const PublicTreino: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<PublicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Progresso persistido no servidor
  const [completedList, setCompletedList] = useState<Record<number, boolean>>({});
  const [sessaoId, setSessaoId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [historicoAnterior, setHistoricoAnterior] = useState<HistoricoAnterior | null>(null);
  const [sessaoConcluida, setSessaoConcluida] = useState(false);
  const [finalizadoEm, setFinalizadoEm] = useState<string | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [endingWorkout, setEndingWorkout] = useState(false);

  // Som de celebração tátil (acorde em C maior)
  const playCelebrationSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.08, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.35);
      });
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // Progressão detalhada de séries (Série 1: 6 reps com 33kg, etc.)
  // Progressão detalhada de séries (Série 1: 6 reps com 33kg, etc.)
  const [setsProgressMap, setSetsProgressMap] = useState<Record<number, ExerciseSetEntry[]>>({});
  const setsProgressMapRef = useRef(setsProgressMap);
  useEffect(() => {
    setsProgressMapRef.current = setsProgressMap;
  }, [setsProgressMap]);

  const syncTimeoutRef = useRef<Record<number, any>>({});

  const saveLocalSets = (newMap: Record<number, ExerciseSetEntry[]>, currentSessaoId?: number | null) => {
    const sId = currentSessaoId || sessaoId;
    if (sId) {
      try {
        localStorage.setItem(`workout-sets-progress-${sId}`, JSON.stringify(newMap));
      } catch {}
    }
  };

  const getExerciseSets = (item: PrescribedExercise): ExerciseSetEntry[] => {
    const existing = setsProgressMap[item.idTreinoExercicio];
    if (existing && existing.length > 0) return existing;
    const match = item.repeticoes ? String(item.repeticoes).match(/\d+/) : null;
    const defaultReps = match ? match[0] : '10';
    const total = item.series || 3;
    const initial: ExerciseSetEntry[] = [];
    for (let i = 1; i <= total; i++) {
      initial.push({
        setNumber: i,
        kg: '',
        reps: defaultReps,
        completed: false
      });
    }
    return initial;
  };

  const syncSetsToServer = async (idTreinoExercicio: number, setsToSync: ExerciseSetEntry[], targetSessaoId?: number) => {
    const activeSessao = targetSessaoId || sessaoId;
    if (!activeSessao) return;
    try {
      await api.post(`/publico/sessao/${activeSessao}/exercicio/${idTreinoExercicio}/series`, {
        series: setsToSync.map(s => {
          const kgClean = s.kg ? String(s.kg).trim().replace(',', '.') : '';
          const repsClean = s.reps ? String(s.reps).trim() : '';
          return {
            numeroSerie: s.setNumber,
            cargaKg: kgClean !== '' && !isNaN(Number(kgClean)) ? Number(kgClean) : null,
            repeticoes: repsClean !== '' && !isNaN(Number(repsClean)) ? Number(repsClean) : null,
            concluido: !!s.completed,
          };
        }),
      });
    } catch (err) {
      console.error('Erro ao sincronizar séries com o servidor:', err);
    }
  };

  const scheduleSyncSets = (idTreinoExercicio: number, setsToSync: ExerciseSetEntry[]) => {
    if (syncTimeoutRef.current[idTreinoExercicio]) {
      clearTimeout(syncTimeoutRef.current[idTreinoExercicio]);
    }
    syncTimeoutRef.current[idTreinoExercicio] = setTimeout(() => {
      syncSetsToServer(idTreinoExercicio, setsToSync);
    }, 600);
  };

  const updateSetKg = (idTreinoExercicio: number, setIndex: number, newKg: string, allSets: ExerciseSetEntry[]) => {
    setSetsProgressMap(prev => {
      const sets = (prev[idTreinoExercicio] || allSets).map(s => ({ ...s }));
      if (!sets[setIndex]) return prev;
      sets[setIndex].kg = newKg;
      // Auto-propaga a carga para séries posteriores vazias não concluídas
      for (let j = setIndex + 1; j < sets.length; j++) {
        if (!sets[j].kg && !sets[j].completed) {
          sets[j].kg = newKg;
        }
      }
      const updated = { ...prev, [idTreinoExercicio]: sets };
      saveLocalSets(updated);
      scheduleSyncSets(idTreinoExercicio, sets);
      return updated;
    });
  };

  const updateSetReps = (idTreinoExercicio: number, setIndex: number, newReps: string, allSets: ExerciseSetEntry[]) => {
    setSetsProgressMap(prev => {
      const sets = (prev[idTreinoExercicio] || allSets).map(s => ({ ...s }));
      if (!sets[setIndex]) return prev;
      sets[setIndex].reps = newReps;
      const updated = { ...prev, [idTreinoExercicio]: sets };
      saveLocalSets(updated);
      scheduleSyncSets(idTreinoExercicio, sets);
      return updated;
    });
  };

  const toggleSetCompleted = (item: PrescribedExercise, setIndex: number, allSets: ExerciseSetEntry[]) => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch {}
    }
    setSetsProgressMap(prev => {
      const sets = (prev[item.idTreinoExercicio] || allSets).map(s => ({ ...s }));
      if (!sets[setIndex]) return prev;
      const willBeCompleted = !sets[setIndex].completed;
      sets[setIndex].completed = willBeCompleted;

      // Inicia timer de descanso automaticamente ao concluir série
      if (willBeCompleted && item.descansoSegundos) {
        startTimer(item.descansoSegundos);
      }

      const updated = { ...prev, [item.idTreinoExercicio]: sets };
      saveLocalSets(updated);

      // Sincroniza status do exercício se todas as séries foram concluídas
      const allDone = sets.every(s => s.completed);
      if (allDone && !completedList[item.idTreinoExercicio]) {
        toggleExerciseCompleted(item.idTreinoExercicio);
      } else if (!allDone && completedList[item.idTreinoExercicio]) {
        toggleExerciseCompleted(item.idTreinoExercicio);
      }

      // Cancela debounce pendente e sincroniza séries imediatamente com o servidor
      if (syncTimeoutRef.current[item.idTreinoExercicio]) {
        clearTimeout(syncTimeoutRef.current[item.idTreinoExercicio]);
      }
      syncSetsToServer(item.idTreinoExercicio, sets);

      return updated;
    });
  };

  const copyPreviousSets = (item: PrescribedExercise, allSets: ExerciseSetEntry[]) => {
    const prevSets = historicoAnterior?.exercicios?.[item.idTreinoExercicio];
    if (!prevSets || prevSets.length === 0) return;

    if ('vibrate' in navigator) {
      try { navigator.vibrate(12); } catch {}
    }

    setSetsProgressMap(prev => {
      const current = (prev[item.idTreinoExercicio] || allSets).map(s => ({ ...s }));
      const updated = current.map(s => {
        const found = prevSets.find(p => p.numeroSerie === s.setNumber);
        if (found) {
          return {
            ...s,
            kg: found.cargaKg !== null && found.cargaKg !== undefined ? String(found.cargaKg) : s.kg,
            reps: found.repeticoes !== null && found.repeticoes !== undefined ? String(found.repeticoes) : s.reps,
          };
        }
        return s;
      });
      const newMap = { ...prev, [item.idTreinoExercicio]: updated };
      saveLocalSets(newMap);
      if (syncTimeoutRef.current[item.idTreinoExercicio]) {
        clearTimeout(syncTimeoutRef.current[item.idTreinoExercicio]);
      }
      syncSetsToServer(item.idTreinoExercicio, updated);
      return newMap;
    });
  };

  const addSet = (item: PrescribedExercise, allSets: ExerciseSetEntry[]) => {
    setSetsProgressMap(prev => {
      const sets = (prev[item.idTreinoExercicio] || allSets).map(s => ({ ...s }));
      const last = sets[sets.length - 1];
      sets.push({
        setNumber: sets.length + 1,
        kg: last ? last.kg : '',
        reps: last ? last.reps : '10',
        completed: false
      });
      const updated = { ...prev, [item.idTreinoExercicio]: sets };
      saveLocalSets(updated);
      syncSetsToServer(item.idTreinoExercicio, sets);
      return updated;
    });
  };

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

        const alunoNome = res.data.aluno?.nome ? res.data.aluno.nome.split(' ')[0] : 'Aluno';
        const protocoloNome = res.data.protocolo?.nome || 'Treino';
        document.title = `${protocoloNome} — ${alunoNome} | TreinosApp`;
        
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

  // ── Sessão persistida no servidor ──────────────────────────────
  const fetchSessao = async (idTreino: number) => {
    if (!token) return;
    try {
      const res = await api.get(`/publico/sessao/${token}/${idTreino}`);
      setSessaoId(res.data.idSessao);
      setSessaoConcluida(!!res.data.concluida);
      setFinalizadoEm(res.data.finalizadoEm || null);
      const mapa: Record<number, boolean> = {};
      (res.data.concluidosIds as number[]).forEach(id => { mapa[id] = true; });
      setCompletedList(mapa);
      setHistoricoAnterior(res.data.historicoAnterior || null);

      // Se há séries salvas hoje no servidor, sincroniza com o estado do app
      if (res.data.seriesHoje && Object.keys(res.data.seriesHoje).length > 0) {
        const next: Record<number, ExerciseSetEntry[]> = {};
        for (const [idStr, serverSets] of Object.entries(res.data.seriesHoje)) {
          const id = Number(idStr);
          next[id] = (serverSets as any[]).map(s => ({
            setNumber: s.numeroSerie,
            kg: s.cargaKg !== null && s.cargaKg !== undefined ? String(s.cargaKg) : '',
            reps: s.repeticoes !== null && s.repeticoes !== undefined ? String(s.repeticoes) : '',
            completed: !!s.concluido
          }));
        }
        setSetsProgressMap(next);
        saveLocalSets(next, res.data.idSessao);
      } else {
        // Se a sessão ainda não tem séries no servidor, restaura cache desta sessão ou inicia limpo
        try {
          const sessionCache = localStorage.getItem(`workout-sets-progress-${res.data.idSessao}`);
          if (sessionCache) {
            setSetsProgressMap(JSON.parse(sessionCache));
          } else {
            setSetsProgressMap({});
          }
        } catch {
          setSetsProgressMap({});
        }
      }
    } catch (err) {
      console.error('Erro ao buscar sessão:', err);
    }
  };

  // Busca sessão sempre que o treino ativo muda
  useEffect(() => {
    if (activeTabId !== null) {
      fetchSessao(activeTabId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId]);

  // Toggle com optimistic update + persistência no servidor
  const toggleExerciseCompleted = async (id: number) => {
    if (!sessaoId || savingId !== null) return;
    setCompletedList(prev => ({ ...prev, [id]: !prev[id] }));
    setSavingId(id);
    try {
      const res = await api.post(`/publico/sessao/${sessaoId}/toggle/${id}`);
      setCompletedList(prev => ({ ...prev, [id]: res.data.concluido }));
    } catch (err) {
      // Reverte em caso de erro
      setCompletedList(prev => ({ ...prev, [id]: !prev[id] }));
      console.error('Erro ao salvar progresso:', err);
    } finally {
      setSavingId(null);
    }
  };

  // Troca de aba: limpa lista antes de buscar nova sessão
  const handleTabChange = (idTreino: number) => {
    setActiveTabId(idTreino);
    setCompletedList({});
    setSessaoId(null);
    setHistoricoAnterior(null);
    setSessaoConcluida(false);
    setFinalizadoEm(null);
    setShowCelebrationModal(false);
    setShowConfirmModal(false);
  };

  // Encerramento do treino (comita para histórico da nova semana)
  const handleSolicitarEncerramento = () => {
    if (totalSeriesConcluidas < totalSeriesTotal) {
      setShowConfirmModal(true);
    } else {
      executarEncerramento();
    }
  };

  const executarEncerramento = async () => {
    if (!sessaoId || endingWorkout) return;
    setEndingWorkout(true);
    try {
      if ('vibrate' in navigator) {
        try { navigator.vibrate([100, 50, 100, 50, 200]); } catch {}
      }
      playCelebrationSound();

      // Monta payload atômico com todos os exercícios do treino atual e suas séries preenchidas
      const exerciciosPayload = sortedExercicios.map(ex => {
        const sets = setsProgressMapRef.current[ex.idTreinoExercicio] || getExerciseSets(ex);
        return {
          idTreinoExercicio: ex.idTreinoExercicio,
          series: sets.map(s => {
            const kgClean = s.kg ? String(s.kg).trim().replace(',', '.') : '';
            const repsClean = s.reps ? String(s.reps).trim() : '';
            return {
              numeroSerie: s.setNumber,
              cargaKg: kgClean !== '' && !isNaN(Number(kgClean)) ? Number(kgClean) : null,
              repeticoes: repsClean !== '' && !isNaN(Number(repsClean)) ? Number(repsClean) : null,
              concluido: !!s.completed,
            };
          }),
        };
      });

      const res = await api.post(`/publico/sessao/${sessaoId}/encerrar`, {
        exercicios: exerciciosPayload,
      });

      setSessaoConcluida(true);
      setFinalizadoEm(res.data.finalizadoEm);
      setShowCelebrationModal(true);
    } catch (err) {
      console.error('Erro ao encerrar treino:', err);
    } finally {
      setEndingWorkout(false);
    }
  };

  const handleIniciarProximoTreino = async () => {
    if (!token || activeTabId === null) return;
    try {
      setShowCelebrationModal(false);
      setSetsProgressMap({});

      const res = await api.post(`/publico/sessao/${token}/${activeTabId}/nova`);
      setSessaoId(res.data.idSessao);
      setSessaoConcluida(false);
      setFinalizadoEm(null);
      setCompletedList({});
      setHistoricoAnterior(res.data.historicoAnterior || null);
    } catch (err) {
      console.error('Erro ao iniciar nova sessão:', err);
    }
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

  const totalSeriesTotal = sortedExercicios.reduce((acc, ex) => {
    const s = getExerciseSets(ex);
    return acc + s.length;
  }, 0);

  const totalSeriesConcluidas = sortedExercicios.reduce((acc, ex) => {
    const s = getExerciseSets(ex);
    return acc + s.filter(item => item.completed).length;
  }, 0);

  const completedExercisesCount = sortedExercicios.filter(ex => {
    const s = getExerciseSets(ex);
    return s.length > 0 && s.every(item => item.completed);
  }).length;

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
              <span>{profissional.profissao}</span>
              <span style={{ color: 'var(--text-2)' }}>|</span>
              <span>CREF {profissional.cref}</span>
            </div>
          </div>
          
          {/* Contact shortcuts */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button 
              onClick={toggleTheme} 
              className="topbar-btn" 
              title={theme === 'dark' ? "Ativar modo claro" : "Ativar modo escuro"}
              aria-label={theme === 'dark' ? "Alternar para modo claro" : "Alternar para modo escuro"}
            >
              {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            </button>
            {profissional.telefone && (
              <a 
                href={`https://wa.me/55${profissional.telefone.replace(/\D/g, '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="topbar-btn" 
                title="WhatsApp do treinador"
                aria-label="Abrir conversa no WhatsApp com o treinador"
              >
                <Phone size={16} aria-hidden="true" />
              </a>
            )}
            {profissional.instagram && (
              <a 
                href={`https://instagram.com/${profissional.instagram.replace('@', '')}`} 
                target="_blank" 
                rel="noreferrer" 
                className="topbar-btn" 
                title="Instagram do treinador"
                aria-label="Abrir perfil no Instagram do treinador"
              >
                <InstagramIcon width={16} height={16} aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '1.25rem auto 0 auto', padding: '0 1rem' }}>
        
        {/* Student welcome & Active protocol details */}
        <div style={{ marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-1)', fontWeight: 500 }}>
            Olá, {aluno.nome.split(' ')[0]}
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
            <div className="ficha-tabs" role="tablist" aria-label="Fichas de treino" style={{ marginBottom: '1.25rem' }}>
              {sortedTreinos.map((treino) => (
                <button
                  key={treino.idTreino}
                  role="tab"
                  aria-selected={activeTabId === treino.idTreino}
                  aria-label={`Ficha ${treino.nome}`}
                  className={`ficha-tab ${activeTabId === treino.idTreino ? 'active' : ''}`}
                  onClick={() => handleTabChange(treino.idTreino)}
                  style={{ flex: 1, textAlign: 'center' }}
                >
                  {treino.nome.replace('Treino ', '')}
                </button>
              ))}
            </div>

            {/* Status de Treino Concluído */}
            {sessaoConcluida && (
              <div className="workout-completed-banner" style={{ marginBottom: '1.25rem', marginTop: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <Trophy size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-0)', display: 'block' }}>
                      Treino Concluído! 🎉
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-1)' }}>
                      {finalizadoEm ? `Finalizado em ${new Date(finalizadoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : 'Histórico gravado no banco.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleIniciarProximoTreino}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.35rem', fontSize: '0.78rem', height: '34px', padding: '0 0.8rem' }}
                >
                  <Sparkles size={13} aria-hidden="true" />
                  <span>Iniciar Nova Semana</span>
                </button>
              </div>
            )}

            {/* Ficha Observation */}
            {activeFicha?.observacao && (
              <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', backgroundColor: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Info size={15} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-0)', lineHeight: '1.45' }}>
                    {activeFicha.observacao}
                  </p>
                </div>
              </div>
            )}

            {/* Exercises List — Tactile iOS Pro with Manual Set Progression */}
            <div className="exercise-stack" style={{ gap: '1rem' }}>
              {sortedExercicios.length > 0 ? (
                sortedExercicios.map((item) => {
                  const sets = getExerciseSets(item);
                  const completedSetsCount = sets.filter(s => s.completed).length;
                  const isCompleted = sets.length > 0 && sets.every(s => s.completed);

                  return (
                    <div 
                      key={item.idTreinoExercicio} 
                      className={`exercise-tactile-card ${isCompleted ? 'completed' : ''}`}
                      style={{ 
                        opacity: isCompleted ? 0.88 : 1, 
                        transition: 'opacity var(--transition), transform var(--transition), background-color var(--transition)',
                      }}
                    >
                      {/* Exercise Header */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                            <span 
                              style={{ 
                                fontSize: '1.025rem', 
                                fontWeight: 700, 
                                color: 'var(--text-0)',
                                letterSpacing: '-0.02em',
                                textDecoration: isCompleted ? 'line-through' : 'none' 
                              }}
                            >
                              {item.exercicio.nome}
                            </span>
                            {isCompleted ? (
                              <span className="badge badge-success" style={{ fontSize: '0.65rem', height: '18px', padding: '0 0.45rem' }}>
                                Feito ✓
                              </span>
                            ) : completedSetsCount > 0 ? (
                              <span className="badge badge-accent" style={{ fontSize: '0.65rem', height: '18px', padding: '0 0.45rem' }}>
                                {completedSetsCount}/{sets.length} séries
                              </span>
                            ) : null}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                            <span className="exercise-block-tag">{item.exercicio.grupoMuscular.nome}</span>
                            {item.tecnica && (
                              <span className="exercise-block-tag" style={{ color: 'var(--accent)', background: 'var(--accent-dim)' }}>
                                {item.tecnica.nome}
                              </span>
                            )}
                            {item.observacao && (
                              <span style={{ color: 'var(--text-1)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                                {item.observacao}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Top Right: Descanso + Vídeo */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                          {item.descansoSegundos && (
                            <button
                              type="button"
                              className="rest-timer-trigger"
                              onClick={() => {
                                if ('vibrate' in navigator) {
                                  try { navigator.vibrate(12); } catch {}
                                }
                                startTimer(item.descansoSegundos!);
                              }}
                              aria-label={`Iniciar tempo de descanso de ${item.descansoSegundos} segundos`}
                              title="Iniciar descanso manual"
                            >
                              <Timer size={12} aria-hidden="true" />
                              <span>{item.descansoSegundos}s</span>
                            </button>
                          )}

                          {item.exercicio.videoUrl && (
                            <a
                              href={item.exercicio.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="exercise-action-btn accent"
                              aria-label={`Assistir vídeo demonstrativo de ${item.exercicio.nome}`}
                              title="Assistir vídeo demonstrativo"
                            >
                              <Video size={18} aria-hidden="true" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Meta Prescrita Banner */}
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        fontSize: '0.75rem', 
                        color: 'var(--text-1)', 
                        marginTop: '0.75rem', 
                        padding: '0.35rem 0.6rem',
                        backgroundColor: 'var(--bg-2)',
                        borderRadius: 'var(--radius-s)'
                      }}>
                        <span>Meta prescrita: <strong>{item.series} séries × {item.repeticoes}</strong></span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>{completedSetsCount} de {sets.length} concluídas</span>
                      </div>

                      {/* Header com data do treino anterior, se houver */}
                      {historicoAnterior?.data && historicoAnterior.exercicios?.[item.idTreinoExercicio]?.length ? (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.7rem',
                          color: 'var(--text-2)',
                          marginTop: '0.4rem',
                          padding: '0.1rem 0.25rem'
                        }}>
                          <History size={12} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
                          <span>Último treino: <strong>{formatDataPtBr(historicoAnterior.data)}</strong> {getDiasAtras(historicoAnterior.data) ? `(${getDiasAtras(historicoAnterior.data)})` : ''}</span>
                        </div>
                      ) : null}

                      {/* Sets Progression Table */}
                      <div className="sets-table">
                        <div className="sets-header">
                          <span>Série</span>
                          <span>Anterior</span>
                          <span>Carga</span>
                          <span>Reps</span>
                          <span>Check</span>
                        </div>

                        {sets.map((set, idx) => {
                          const prevExerciseSets = historicoAnterior?.exercicios?.[item.idTreinoExercicio];
                          const prevSet = prevExerciseSets?.find(p => p.numeroSerie === set.setNumber);

                          // Indicador de PR / Sobrecarga Progressiva
                          const currentKg = parseFloat(String(set.kg).replace(',', '.'));
                          const prevKg = prevSet?.cargaKg ?? null;
                          const currentReps = parseInt(String(set.reps), 10);
                          const prevReps = prevSet?.repeticoes ?? null;

                          const isKgPR = prevKg !== null && !isNaN(currentKg) && currentKg > prevKg;
                          const isRepsPR = !isKgPR && prevKg !== null && prevReps !== null && !isNaN(currentKg) && currentKg >= prevKg && !isNaN(currentReps) && currentReps > prevReps;

                          return (
                            <div 
                              key={set.setNumber} 
                              className={`set-row ${set.completed ? 'completed' : ''}`}
                            >
                              {/* Set Number + PR Badge */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div className="set-badge">{set.setNumber}</div>
                                {(isKgPR || isRepsPR) && (
                                  <span 
                                    className="set-pr-badge" 
                                    title={isKgPR ? `+${(currentKg - prevKg!).toFixed(1).replace('.0', '')}kg acima do treino anterior!` : `+${currentReps - prevReps!} repetições a mais!`}
                                  >
                                    <TrendingUp size={9} aria-hidden="true" />
                                    {isKgPR ? `+${(currentKg - prevKg!).toFixed(1).replace('.0', '')}k` : `+${currentReps - prevReps!}r`}
                                  </span>
                                )}
                              </div>

                              {/* Anterior (Treino anterior) */}
                              <div className="set-prev-cell">
                                {prevSet && (prevSet.cargaKg !== null || prevSet.repeticoes !== null) ? (
                                  <span 
                                    className="set-prev-tag"
                                    title={`Último treino: ${prevSet.cargaKg ?? 0}kg × ${prevSet.repeticoes ?? 0} reps`}
                                  >
                                    {prevSet.cargaKg !== null ? `${prevSet.cargaKg}k` : '—'} × {prevSet.repeticoes !== null ? prevSet.repeticoes : '—'}
                                  </span>
                                ) : (
                                  <span className="set-prev-empty">—</span>
                                )}
                              </div>

                              {/* Manual Carga (kg) input — aceita qualquer valor: 33, 12.5, 33,5, 1, 2, 3kg */}
                              <div className="set-input-wrap">
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={set.kg}
                                  onChange={(e) => updateSetKg(item.idTreinoExercicio, idx, e.target.value, sets)}
                                  onBlur={() => {
                                    const currentSets = setsProgressMapRef.current[item.idTreinoExercicio] || sets;
                                    syncSetsToServer(item.idTreinoExercicio, currentSets);
                                  }}
                                  placeholder={prevSet?.cargaKg !== null && prevSet?.cargaKg !== undefined ? String(prevSet.cargaKg) : "0"}
                                  className="set-input"
                                  aria-label={`Série ${set.setNumber} carga em kg`}
                                />
                                <span className="set-input-unit">kg</span>
                              </div>

                              {/* Manual Reps input */}
                              <div className="set-input-wrap">
                                <input
                                  type="number"
                                  min="1"
                                  inputMode="numeric"
                                  value={set.reps}
                                  onChange={(e) => updateSetReps(item.idTreinoExercicio, idx, e.target.value, sets)}
                                  onBlur={() => {
                                    const currentSets = setsProgressMapRef.current[item.idTreinoExercicio] || sets;
                                    syncSetsToServer(item.idTreinoExercicio, currentSets);
                                  }}
                                  placeholder={prevSet?.repeticoes !== null && prevSet?.repeticoes !== undefined ? String(prevSet.repeticoes) : "reps"}
                                  className="set-input"
                                  aria-label={`Série ${set.setNumber} repetições`}
                                />
                                <span className="set-input-unit">reps</span>
                              </div>

                              {/* Tactile Set Checkmark */}
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={set.completed}
                                aria-label={`Concluir série ${set.setNumber} de ${item.exercicio.nome}`}
                                onClick={() => toggleSetCompleted(item, idx, sets)}
                                className={`set-check-btn ${set.completed ? 'completed' : ''}`}
                                title={set.completed ? "Desmarcar série" : "Concluir série e iniciar descanso"}
                              >
                                {set.completed ? (
                                  <Check size={18} strokeWidth={3} className="check-pop-icon" aria-hidden="true" />
                                ) : (
                                  <div style={{ width: 10, height: 10, borderRadius: 2, border: '1.5px solid var(--border-strong)' }} aria-hidden="true" />
                                )}
                              </button>
                            </div>
                          );
                        })}

                        {/* Botões de Ação: Adicionar série + Repetir cargas anteriores */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => addSet(item, sets)}
                            style={{
                              padding: '0.45rem 0.65rem',
                              border: '1px dashed var(--border-strong)',
                              borderRadius: 'var(--radius-s)',
                              background: 'transparent',
                              color: 'var(--text-1)',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '0.35rem',
                              transition: 'color var(--transition), border-color var(--transition)'
                            }}
                            aria-label="Adicionar série adicional"
                          >
                            <span>+ Adicionar série</span>
                          </button>

                          {historicoAnterior?.exercicios?.[item.idTreinoExercicio]?.length ? (
                            <button
                              type="button"
                              onClick={() => copyPreviousSets(item, sets)}
                              className="set-repeat-prev-btn"
                              title="Preencher automaticamente com os mesmos pesos e repetições do último treino"
                              aria-label="Repetir cargas do último treino"
                            >
                              <RotateCcw size={12} aria-hidden="true" />
                              <span>Repetir anteriores</span>
                            </button>
                          ) : null}
                        </div>
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

            {/* Action Bar: Encerrar Treino / Treino Finalizado */}
            {sortedExercicios.length > 0 && (
              sessaoConcluida ? (
                <div className="workout-completed-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Trophy size={24} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-0)', display: 'block' }}>
                        Treino Finalizado com Sucesso! 🏆
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>
                        Seus dados foram arquivados e servirão de meta para a próxima semana.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleIniciarProximoTreino}
                    className="btn btn-primary"
                    style={{ gap: '0.45rem', padding: '0.65rem 1.1rem', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    <Sparkles size={16} aria-hidden="true" />
                    <span>Iniciar Próximo Treino (Nova Semana)</span>
                  </button>
                </div>
              ) : (
                <div className="workout-finish-bar">
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Progresso da Sessão
                    </span>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-0)', fontVariantNumeric: 'tabular-nums', marginTop: '2px' }}>
                      {totalSeriesConcluidas} de {totalSeriesTotal} séries concluídas
                      {completedExercisesCount > 0 && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-1)', marginLeft: '0.5rem' }}>
                          ({completedExercisesCount}/{sortedExercicios.length} exerc.)
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSolicitarEncerramento}
                    disabled={endingWorkout}
                    className="btn btn-primary"
                    style={{
                      padding: '0.75rem 1.35rem',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      borderRadius: 'var(--radius-m)',
                      boxShadow: '0 4px 18px rgba(204, 255, 0, 0.28)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      minHeight: '44px'
                    }}
                    aria-label="Encerrar treino de hoje"
                  >
                    <Flag size={18} aria-hidden="true" />
                    <span>{endingWorkout ? 'Salvando...' : 'Encerrar Treino'}</span>
                  </button>
                </div>
              )
            )}

            {/* Volume Summary */}
            {Object.keys(volume).length > 0 && (
              <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1.25rem' }}>
                <span style={{ color: 'var(--text-1)', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
                  Volume semanal do programa:
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
        <div className="floating-rest-timer" role="region" aria-label="Contador de descanso">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Timer size={20} className="text-accent animate-pulse" aria-hidden="true" />
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', lineHeight: 1.2 }}>Tempo de Descanso</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-1)' }}>Respire e recupere as forças</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font)', fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', letterSpacing: '-0.02em' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <button 
              onClick={stopTimer} 
              className="btn btn-secondary btn-sm"
              style={{ height: '34px', minWidth: '44px', fontSize: '0.75rem', fontWeight: 600 }}
              aria-label="Finalizar tempo de descanso"
            >
              Pular
            </button>
          </div>

          {/* Progress bar background indicator */}
          <div 
            aria-hidden="true"
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              backgroundColor: 'var(--accent)',
              transform: `scaleX(${timerDuration > 0 ? timeLeft / timerDuration : 0})`,
              transformOrigin: 'left',
              transition: 'transform 1s linear',
              borderRadius: '0 0 var(--radius-l) var(--radius-l)'
            }} 
          />
        </div>
      )}

      {/* Modal de Confirmação para Encerrar Treino */}
      {showConfirmModal && (
        <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
              <AlertCircle size={22} style={{ color: 'var(--accent)', flexShrink: 0 }} aria-hidden="true" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-0)' }}>Encerrar Treino?</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-1)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Você concluiu <strong>{totalSeriesConcluidas} de {totalSeriesTotal} séries</strong>. Deseja realmente finalizar o treino de hoje? Os pesos e repetições preenchidos serão salvos no banco de dados e usados como referência na próxima semana.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfirmModal(false)}
                style={{ height: '42px', minWidth: '44px', fontSize: '0.85rem' }}
              >
                Continuar Treinando
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  setShowConfirmModal(false);
                  executarEncerramento();
                }}
                style={{ height: '42px', minWidth: '44px', fontSize: '0.85rem', fontWeight: 700 }}
              >
                Sim, Encerrar Treino
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Celebração de Treino Encerrado */}
      {showCelebrationModal && (
        <div className="modal-backdrop" onClick={() => setShowCelebrationModal(false)}>
          <div className="modal-content" style={{ textAlign: 'center', padding: '2rem 1.5rem' }} onClick={e => e.stopPropagation()}>
            <div style={{ 
              width: '64px', 
              height: '64px', 
              borderRadius: '50%', 
              backgroundColor: 'var(--accent-dim)', 
              color: 'var(--accent)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1rem auto'
            }}>
              <Trophy size={34} aria-hidden="true" />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-0)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
              Treino Finalizado! 🎉
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-1)', marginBottom: '1.5rem', lineHeight: 1.45 }}>
              Excelente trabalho! Suas cargas e repetições foram gravadas no seu histórico. Na próxima semana, elas aparecerão automaticamente na coluna <strong>Anterior</strong> para você buscar sobrecarga progressiva.
            </p>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '0.75rem', 
              marginBottom: '1.5rem',
              background: 'var(--bg-2)',
              padding: '1rem',
              borderRadius: 'var(--radius-m)',
              border: '1px solid var(--border)'
            }}>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Séries Feitas</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--text-0)', fontVariantNumeric: 'tabular-nums' }}>{totalSeriesConcluidas}</strong>
              </div>
              <div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-2)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Exercícios</span>
                <strong style={{ fontSize: '1.3rem', color: 'var(--accent)', fontVariantNumeric: 'tabular-nums' }}>{completedExercisesCount}</strong>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={handleIniciarProximoTreino}
                className="btn btn-primary"
                style={{ width: '100%', height: '46px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <Sparkles size={16} aria-hidden="true" />
                <span>Iniciar Próximo Treino (Nova Semana)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCelebrationModal(false)}
                className="btn btn-secondary"
                style={{ width: '100%', height: '42px', fontSize: '0.85rem' }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
