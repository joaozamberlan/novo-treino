import React, { useEffect, useState, useRef } from 'react';
import { MeuProgresso } from '../../components/Progresso';
import type { Progresso } from '../../utils/progresso';
import { RodapeTreino } from '../../components/RodapeTreino';
import { rodapeEfetivo } from '../../utils/rodape';
import { TabelaProgressao } from '../../components/TabelaProgressao';
import { useSearchParams } from 'react-router-dom';
import alunoApi from '../../services/alunoApi';
import { toast } from 'sonner';
import { formatDescanso } from '../../utils/descanso';
import { FichaPdf } from '../../components/FichaPdf';
import { VolumeSemanal } from '../../components/VolumeSemanal';
import { baixarPdfDoTreino } from '../../utils/pdf';
import type { PrescribedExercise, Protocolo, ProtocoloResumo } from '../../types/treino';
import {
  Award, Phone, Video, FileText,
  Timer, Check, RefreshCw, AlertCircle, Sun, Moon, Info,
  History, RotateCcw, TrendingUp, Flag, CheckCircle2, Download, LogOut, Smartphone
} from 'lucide-react';
import { BrandLogo } from '../../components/BrandLogo';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { useTema } from '../../hooks/useTema';
import { ModalPortal } from '../../components/ModalPortal';
import { ActionMenu, type ActionMenuItem } from '../../components/ActionMenu';
import { mensagemDeErro } from '../../utils/alunoAcesso';
import { useAlunoAuth } from '../../contexts/AlunoAuthContext';

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

interface Profissional {
  nome: string;
  cref: string;
  profissao: string;
  telefone?: string;
  instagram?: string;
  logoUrl?: string;
  rodapeTreino?: string | null;
}

// GET /aluno/me
interface Perfil {
  aluno: { idAluno: number; nome: string };
  profissional: Profissional;
}

// Fichas de um protocolo, guardadas junto com o pedido que as trouxe
// (`para` = ?protocolo= da URL; null = protocolo atual). Enquanto `para` for
// diferente do que a URL pede, a tela mostra "carregando".
interface FichasCarregadas {
  para: number | null;
  protocolo: Protocolo | null;
  isAtual: boolean;
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

const fimDoDescanso = (segundos: number) => Date.now() + segundos * 1000;

// iPadOS 13+ se identifica como Mac; o toque múltiplo o distingue de um Mac de verdade.
const isIosDevice = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (/macintosh/i.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

// Área do aluno logado (telefone + PIN): fichas do protocolo atual com
// registro de cargas, e os protocolos anteriores em somente leitura.
export const AreaAluno: React.FC = () => {
  const { sair, renovarToken } = useAlunoAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  // ?protocolo=ID abre um protocolo específico; sem ele, o atual
  const idProtocoloParam = Number(searchParams.get('protocolo')) || null;

  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [protocolos, setProtocolos] = useState<ProtocoloResumo[]>([]);
  const [fichas, setFichas] = useState<FichasCarregadas | null>(null);
  const [erro, setErro] = useState<{ para: number | null; mensagem: string } | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [progresso, setProgresso] = useState<Progresso | null>(null);

  const carregando = !perfil || !fichas || fichas.para !== idProtocoloParam;
  const error = erro && erro.para === idProtocoloParam ? erro.mensagem : '';
  const somenteLeitura = !!fichas && !fichas.isAtual;

  // Progresso persistido no servidor
  const [sessaoId, setSessaoId] = useState<number | null>(null);
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
  const [setsProgressMap, setSetsProgressMap] = useState<Record<number, ExerciseSetEntry[]>>({});
  const setsProgressMapRef = useRef(setsProgressMap);
  useEffect(() => {
    setsProgressMapRef.current = setsProgressMap;
  }, [setsProgressMap]);

  const syncTimeoutRef = useRef<Record<number, any>>({});

  // Exercícios cujas séries não chegaram ao servidor (idTreinoExercicio → idSessao).
  // Os dados continuam no localStorage; o aviso some quando o reenvio funciona.
  const [seriesPendentes, setSeriesPendentes] = useState<Record<number, number>>({});
  const [reenviando, setReenviando] = useState(false);

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
    if (!activeSessao) return false;
    try {
      await alunoApi.post(`/aluno/sessao/${activeSessao}/exercicio/${idTreinoExercicio}/series`, {
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
      setSeriesPendentes((prev) => {
        if (prev[idTreinoExercicio] !== activeSessao) return prev;
        const next = { ...prev };
        delete next[idTreinoExercicio];
        return next;
      });
      return true;
    } catch (err) {
      console.error('Erro ao sincronizar séries com o servidor:', err);
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 401: sessão encerrada (o app já voltou para o login). 403: o treinador
      // trocou o protocolo atual. Reenviar não resolve nenhum dos dois.
      if (status === 401 || status === 403) {
        if (status === 403) {
          toast.error(mensagemDeErro(err, 'Este protocolo não é mais o atual.'), { id: 'protocolo-leitura' });
          setTentativa((n) => n + 1);
        }
        setSeriesPendentes((prev) => {
          const next = { ...prev };
          delete next[idTreinoExercicio];
          return next;
        });
        return false;
      }
      setSeriesPendentes((prev) => ({ ...prev, [idTreinoExercicio]: activeSessao }));
      return false;
    }
  };

  // Reenvia o estado mais recente de cada exercício pendente. Séries de uma
  // sessão que já não está aberta na tela vêm do localStorage dessa sessão.
  const reenviarPendentes = async () => {
    const pendentes = Object.entries(seriesPendentesRef.current);
    if (pendentes.length === 0 || reenviandoRef.current) return;
    reenviandoRef.current = true;
    setReenviando(true);
    try {
      for (const [id, idSessaoPendente] of pendentes) {
        const idTreinoExercicio = Number(id);
        let sets: ExerciseSetEntry[] | undefined;
        if (idSessaoPendente === sessaoIdRef.current) {
          sets = setsProgressMapRef.current[idTreinoExercicio];
        } else {
          try {
            const salvo = localStorage.getItem(`workout-sets-progress-${idSessaoPendente}`);
            sets = salvo ? JSON.parse(salvo)[idTreinoExercicio] : undefined;
          } catch {
            sets = undefined;
          }
        }
        if (!sets) {
          // Nada para reenviar (dados locais apagados): descarta o aviso
          setSeriesPendentes((prev) => {
            const next = { ...prev };
            delete next[idTreinoExercicio];
            return next;
          });
          continue;
        }
        await syncSetsToServer(idTreinoExercicio, sets, idSessaoPendente);
      }
    } finally {
      reenviandoRef.current = false;
      setReenviando(false);
    }
  };

  // Refs lidas pelo reenvio (chamado por timer/evento, fora do render)
  const seriesPendentesRef = useRef(seriesPendentes);
  const sessaoIdRef = useRef(sessaoId);
  const reenviandoRef = useRef(false);
  const reenviarPendentesRef = useRef(reenviarPendentes);
  useEffect(() => {
    seriesPendentesRef.current = seriesPendentes;
    sessaoIdRef.current = sessaoId;
    reenviarPendentesRef.current = reenviarPendentes;
  });

  const temPendentes = Object.keys(seriesPendentes).length > 0;

  // Tenta de novo quando a conexão volta e, enquanto houver pendência, a cada 15s
  useEffect(() => {
    if (!temPendentes) return;
    const tentar = () => reenviarPendentesRef.current();
    window.addEventListener('online', tentar);
    const intervalo = setInterval(tentar, 15_000);
    return () => {
      window.removeEventListener('online', tentar);
      clearInterval(intervalo);
    };
  }, [temPendentes]);

  const scheduleSyncSets = (idTreinoExercicio: number, setsToSync: ExerciseSetEntry[]) => {
    if (syncTimeoutRef.current[idTreinoExercicio]) {
      clearTimeout(syncTimeoutRef.current[idTreinoExercicio]);
    }
    syncTimeoutRef.current[idTreinoExercicio] = setTimeout(() => {
      syncSetsToServer(idTreinoExercicio, setsToSync);
    }, 600);
  };

  // Cópia editável das séries atuais de um exercício
  const currentSets = (idTreinoExercicio: number, allSets: ExerciseSetEntry[]) =>
    (setsProgressMapRef.current[idTreinoExercicio] || allSets).map(s => ({ ...s }));

  // Grava o novo estado das séries de um exercício. Fica fora do updater do
  // setState: o React pode executar updaters mais de uma vez, e aqui há efeitos
  // colaterais (localStorage, requisições). A ref é atualizada na hora para que
  // toques rápidos em sequência leiam o estado mais recente.
  const commitSets = (idTreinoExercicio: number, sets: ExerciseSetEntry[]) => {
    const updated = { ...setsProgressMapRef.current, [idTreinoExercicio]: sets };
    setsProgressMapRef.current = updated;
    setSetsProgressMap(updated);
    saveLocalSets(updated);
  };

  const syncNow = (idTreinoExercicio: number, sets: ExerciseSetEntry[]) => {
    if (syncTimeoutRef.current[idTreinoExercicio]) {
      clearTimeout(syncTimeoutRef.current[idTreinoExercicio]);
    }
    syncSetsToServer(idTreinoExercicio, sets);
  };

  const updateSetKg = (idTreinoExercicio: number, setIndex: number, newKg: string, allSets: ExerciseSetEntry[]) => {
    const sets = currentSets(idTreinoExercicio, allSets);
    if (!sets[setIndex]) return;
    sets[setIndex].kg = newKg;
    // Auto-propaga a carga para séries posteriores vazias não concluídas
    for (let j = setIndex + 1; j < sets.length; j++) {
      if (!sets[j].kg && !sets[j].completed) {
        sets[j].kg = newKg;
      }
    }
    commitSets(idTreinoExercicio, sets);
    scheduleSyncSets(idTreinoExercicio, sets);
  };

  const updateSetReps = (idTreinoExercicio: number, setIndex: number, newReps: string, allSets: ExerciseSetEntry[]) => {
    const sets = currentSets(idTreinoExercicio, allSets);
    if (!sets[setIndex]) return;
    sets[setIndex].reps = newReps;
    commitSets(idTreinoExercicio, sets);
    scheduleSyncSets(idTreinoExercicio, sets);
  };

  const toggleSetCompleted = (item: PrescribedExercise, setIndex: number, allSets: ExerciseSetEntry[]) => {
    if ('vibrate' in navigator) {
      try { navigator.vibrate(15); } catch {}
    }
    const sets = currentSets(item.idTreinoExercicio, allSets);
    if (!sets[setIndex]) return;
    const willBeCompleted = !sets[setIndex].completed;
    sets[setIndex].completed = willBeCompleted;

    // Inicia timer de descanso automaticamente ao concluir série
    if (willBeCompleted && item.descansoSegundos) {
      startTimer(item.descansoSegundos);
    }

    commitSets(item.idTreinoExercicio, sets);
    // O servidor marca o exercício como concluído a partir das próprias séries.
    // Chamar também o /toggle criava uma corrida que podia desfazer a marcação.
    syncNow(item.idTreinoExercicio, sets);
  };

  const copyPreviousSets = (item: PrescribedExercise, allSets: ExerciseSetEntry[]) => {
    const prevSets = historicoAnterior?.exercicios?.[item.idTreinoExercicio];
    if (!prevSets || prevSets.length === 0) return;

    if ('vibrate' in navigator) {
      try { navigator.vibrate(12); } catch {}
    }

    const updated = currentSets(item.idTreinoExercicio, allSets).map(s => {
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
    commitSets(item.idTreinoExercicio, updated);
    syncNow(item.idTreinoExercicio, updated);
  };

  const addSet = (item: PrescribedExercise, allSets: ExerciseSetEntry[]) => {
    const sets = currentSets(item.idTreinoExercicio, allSets);
    const last = sets[sets.length - 1];
    sets.push({
      setNumber: sets.length + 1,
      kg: last ? last.kg : '',
      reps: last ? last.reps : '10',
      completed: false
    });
    commitSets(item.idTreinoExercicio, sets);
    syncSetsToServer(item.idTreinoExercicio, sets);
  };

  // Remove apenas a última série, e só se for extra (acima do prescrito pelo treinador).
  const removeExtraSet = async (item: PrescribedExercise, allSets: ExerciseSetEntry[]) => {
    const current = setsProgressMapRef.current[item.idTreinoExercicio] || allSets;
    const last = current[current.length - 1];
    if (!last || last.setNumber <= (item.series || 3)) return;

    const remaining = current.slice(0, -1);
    commitSets(item.idTreinoExercicio, remaining);

    if (sessaoId) {
      try {
        await alunoApi.delete(`/aluno/sessao/${sessaoId}/exercicio/${item.idTreinoExercicio}/series/${last.setNumber}`);
        syncSetsToServer(item.idTreinoExercicio, remaining);
      } catch (err) {
        console.error('Erro ao remover série extra:', err);
      }
    }
  };

  const { theme, toggleTheme } = useTema();

  const { canInstall, install } = usePWAInstall();

  const handleDownloadPdf = () => baixarPdfDoTreino(perfil?.aluno.nome);

  // Timer states
  const [timerDuration, setTimerDuration] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerRunning, setTimerRunning] = useState(false);
  // Instante em que o descanso acaba. O restante é recalculado a partir dele:
  // com a tela bloqueada o iOS pausa o setInterval, e um contador que só
  // decrementa voltava atrasado.
  const timerEndRef = useRef(0);

  // Dados do aluno e do treinador + lista de protocolos
  useEffect(() => {
    let cancelado = false;
    Promise.all([alunoApi.get('/aluno/me'), alunoApi.get('/aluno/protocolos')])
      .then(([me, lista]) => {
        if (cancelado) return;
        if (me.data.accessToken) renovarToken(me.data.accessToken);
        setPerfil({ aluno: me.data.aluno, profissional: me.data.profissional });
        setProtocolos(lista.data);
      })
      .catch((err) => {
        if (cancelado) return;
        console.error(err);
        setErro({ para: idProtocoloParam, mensagem: mensagemDeErro(err, 'Não foi possível carregar seu treino.') });
      });
    return () => { cancelado = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [renovarToken, tentativa]);

  // Fichas do protocolo pedido na URL (o atual, quando ela não diz outro)
  useEffect(() => {
    let cancelado = false;
    alunoApi.get(idProtocoloParam ? `/aluno/protocolos/${idProtocoloParam}` : '/aluno/protocolos/atual')
      .then((res) => {
        if (cancelado) return;
        const protocolo: Protocolo | null = res.data.protocolo;
        const primeira = protocolo ? [...protocolo.treinos].sort((a, b) => a.ordem - b.ordem)[0] : undefined;

        // Estado da sessão é da ficha anterior: começa limpo no protocolo novo
        setSessaoId(null);
        setHistoricoAnterior(null);
        setSessaoConcluida(false);
        setFinalizadoEm(null);
        setSetsProgressMap({});
        setProgresso(null);
        setActiveTabId(primeira?.idTreino ?? null);
        setErro(null);
        setFichas({ para: idProtocoloParam, protocolo, isAtual: !!res.data.isAtual });
      })
      .catch((err) => {
        if (cancelado) return;
        console.error(err);
        // Protocolo excluído pelo treinador (ou link antigo): cai no atual
        if (idProtocoloParam && err.response?.status === 404) {
          setSearchParams({}, { replace: true });
          return;
        }
        setErro({ para: idProtocoloParam, mensagem: mensagemDeErro(err, 'Não foi possível carregar seu treino.') });
      });
    return () => { cancelado = true; };
  }, [idProtocoloParam, tentativa, setSearchParams]);

  useEffect(() => {
    document.title = perfil ? `Treino: ${perfil.aluno.nome} | TreinosApp` : 'Meu treino | TreinosApp';
  }, [perfil]);

  // Countdown timer logic
  useEffect(() => {
    let interval: any;
    if (timerRunning && timeLeft > 0) {
      const tick = () => setTimeLeft(Math.max(0, Math.ceil((timerEndRef.current - Date.now()) / 1000)));
      interval = setInterval(tick, 1000);
      // Ao voltar para a aba/desbloquear, corrige na hora em vez de esperar o próximo tick.
      document.addEventListener('visibilitychange', tick);
      return () => {
        clearInterval(interval);
        document.removeEventListener('visibilitychange', tick);
      };
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
    timerEndRef.current = fimDoDescanso(seconds);
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
    try {
      const res = await alunoApi.get(`/aluno/sessao/${idTreino}`);
      setSessaoId(res.data.idSessao);
      setSessaoConcluida(!!res.data.concluida);
      setFinalizadoEm(res.data.finalizadoEm || null);
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

  // Busca sessão sempre que o treino ativo muda. Protocolo anterior é somente
  // leitura: não tem sessão para abrir (o servidor recusaria).
  useEffect(() => {
    if (activeTabId !== null && !somenteLeitura) {
      fetchSessao(activeTabId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTabId, somenteLeitura]);

  // Progresso de cargas: recarrega ao trocar de ficha e ao encerrar o treino
  const idProtocoloAberto = fichas?.protocolo?.idProtocolo ?? null;
  useEffect(() => {
    if (!idProtocoloAberto) return;
    let cancelado = false;
    alunoApi.get(`/aluno/progresso/${idProtocoloAberto}`)
      .then((res) => { if (!cancelado) setProgresso(res.data); })
      .catch((err) => console.error('Erro ao carregar progresso:', err));
    return () => { cancelado = true; };
  }, [idProtocoloAberto, activeTabId, sessaoConcluida]);

  // Troca de aba: limpa lista antes de buscar nova sessão
  const handleTabChange = (idTreino: number) => {
    setActiveTabId(idTreino);
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

      const res = await alunoApi.post(`/aluno/sessao/${sessaoId}/encerrar`, {
        exercicios: exerciciosPayload,
      });

      setSessaoConcluida(true);
      setFinalizadoEm(res.data.finalizadoEm);
      setShowCelebrationModal(true);
    } catch (err) {
      console.error('Erro ao encerrar treino:', err);
      toast.error('Não foi possível encerrar o treino. Verifique sua conexão e tente de novo.');
    } finally {
      setEndingWorkout(false);
    }
  };

  const handleIniciarProximoTreino = async () => {
    if (activeTabId === null) return;
    try {
      setShowCelebrationModal(false);
      setSetsProgressMap({});

      const res = await alunoApi.post(`/aluno/sessao/${activeTabId}/nova`);
      setSessaoId(res.data.idSessao);
      setSessaoConcluida(false);
      setFinalizadoEm(null);
      setHistoricoAnterior(res.data.historicoAnterior || null);
    } catch (err) {
      console.error('Erro ao iniciar nova sessão:', err);
    }
  };

  if (error) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', gap: '1rem', backgroundColor: 'var(--bg-0)', textAlign: 'center' }}>
        <AlertCircle size={40} className="text-danger" />
        <h1>Não foi possível abrir seu treino</h1>
        <p style={{ maxWidth: '400px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            type="button"
            className="btn btn-primary"
            style={{ height: '44px' }}
            onClick={() => { setErro(null); setTentativa((n) => n + 1); }}
          >
            Tentar de novo
          </button>
          <button type="button" className="btn btn-secondary" style={{ height: '44px' }} onClick={sair}>
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (carregando) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem', backgroundColor: 'var(--bg-0)', color: 'var(--text-1)' }}>
        <RefreshCw className="animate-spin" size={24} />
        <span>Carregando sua ficha de treinos...</span>
      </div>
    );
  }

  const { aluno, profissional } = perfil;
  const { protocolo, isAtual } = fichas;
  const protocoloAtual = protocolos.find((p) => p.ativo);

  const abrirProtocolo = (idProtocolo: number) => {
    const escolhido = protocolos.find((p) => p.idProtocolo === idProtocolo);
    setSearchParams(escolhido?.ativo ? {} : { protocolo: String(idProtocolo) });
  };

  const instalarNoIos = isIosDevice() && !isStandalone();
  const menu: ActionMenuItem[] = [
    ...(canInstall || instalarNoIos
      ? [{
          label: 'Instalar app',
          icon: <Download size={14} aria-hidden="true" />,
          onClick: () => (canInstall ? install() : setShowIosHint(true)),
        }]
      : []),
    {
      label: theme === 'dark' ? 'Modo claro' : 'Modo escuro',
      icon: theme === 'dark' ? <Sun size={14} aria-hidden="true" /> : <Moon size={14} aria-hidden="true" />,
      onClick: toggleTheme,
    },
    { label: 'Sair', icon: <LogOut size={14} aria-hidden="true" />, onClick: sair, danger: true },
  ];

  const activeFicha = protocolo?.treinos.find(t => t.idTreino === activeTabId);
  const sortedTreinos = protocolo?.treinos ? [...protocolo.treinos].sort((a, b) => a.ordem - b.ordem) : [];
  const sortedExercicios = activeFicha?.exercicios ? [...activeFicha.exercicios].sort((a, b) => a.ordem - b.ordem) : [];

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


  return (
    <div className="animate-in" style={{ minHeight: '100vh', backgroundColor: 'var(--bg-0)', color: 'var(--text-0)', paddingBottom: '5rem' }}>


      {/* Print-only PDF export (hidden on screen, captured by html2pdf on demand) */}
      {protocolo && (
        <FichaPdf profissional={profissional} aluno={aluno} protocolo={protocolo} />
      )}

      {/* Personal Trainer Branding Header. No app instalado do iPhone a página
          começa atrás da barra de status (hora, Wi-Fi): --sat reserva esse espaço. */}
      <header style={{ backgroundColor: 'var(--bg-1)', borderBottom: '1px solid var(--border)', borderTop: '2.5px solid var(--accent)', padding: 'calc(1rem + var(--sat)) 1rem 1rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {profissional.logoUrl ? (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
              <img src={profissional.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '8px', backgroundColor: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', flexShrink: 0, color: 'var(--accent-text)' }}>
              <BrandLogo size={24} showText={false} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {profissional.nome}
            </h2>
            {/* Em tela estreita o CREF desce para a linha de baixo em vez de
                passar por cima dos botões ao lado */}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0 0.5rem', marginTop: '0.1rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Award size={12} className="text-accent" style={{ flexShrink: 0 }} />
                {profissional.profissao}
              </span>
              {profissional.cref && (
                <span style={{ whiteSpace: 'nowrap' }}>CREF {profissional.cref}</span>
              )}
            </div>
          </div>
          
          {/* Contact shortcuts */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexShrink: 0 }}>
            {protocolo && (
              <button
                onClick={handleDownloadPdf}
                className="topbar-btn"
                title="Baixar PDF do treino"
                aria-label="Baixar PDF do treino"
              >
                <FileText size={16} aria-hidden="true" />
              </button>
            )}
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
            <ActionMenu label="Mais opções" items={menu} />
          </div>
        </div>
      </header>

      <main style={{ maxWidth: '600px', margin: '1.25rem auto 0 auto', padding: '0 1rem' }}>
        
        {/* Protocolo atual e anteriores */}
        {protocolos.length > 1 && (
          <div className="protocolo-seletor">
            <label className="form-label" htmlFor="protocolo">Protocolo</label>
            <select
              id="protocolo"
              className="form-input"
              value={protocolo?.idProtocolo ?? ''}
              onChange={(e) => abrirProtocolo(Number(e.target.value))}
            >
              {!protocolo && <option value="" disabled>Sem protocolo atual</option>}
              {protocolos.map((p) => (
                <option key={p.idProtocolo} value={p.idProtocolo}>
                  {p.nome}{p.ativo ? ' (atual)' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Student welcome & Active protocol details */}
        <div style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <span style={{ width: '7px', height: '7px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              {protocolo?.nome ? `PROTOCOLO // ${protocolo.nome.toUpperCase()}` : 'PRESCRIÇÃO TÉCNICA'}
            </span>
          </div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.025em', margin: '0.15rem 0' }}>
            {protocolo?.nome || 'Ficha de Treinos'}
          </h1>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-1)', marginTop: '0.2rem' }}>
            Aluno: <strong style={{ color: 'var(--text-0)' }}>{aluno.nome}</strong> • Treinador: {profissional.nome}
          </div>

          {!isAtual && (
            <div className="protocolo-leitura-aviso">
              <span>
                <strong>Protocolo anterior</strong>
                {protocolo?.dataFim ? `, encerrado em ${formatDataPtBr(protocolo.dataFim.split('T')[0])}` : ''}. Você pode consultar as fichas e o histórico, mas as cargas são registradas só no protocolo atual.
              </span>
              {protocoloAtual && (
                <button type="button" onClick={() => setSearchParams({})}>
                  Ver protocolo atual →
                </button>
              )}
            </div>
          )}

          {isAtual && protocolo && (
            <span
              className="badge"
              style={{
                marginTop: '0.6rem',
                display: 'inline-flex',
                backgroundColor: 'rgba(45, 168, 104, 0.12)',
                color: 'var(--success-text)',
                border: '1px solid var(--success)',
                fontSize: '0.68rem',
                fontWeight: 800,
                letterSpacing: '0.03em',
              }}
            >
              PERIODIZAÇÃO ATUAL
            </span>
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
                  <CheckCircle2 size={20} style={{ color: 'var(--success-text)', flexShrink: 0 }} aria-hidden="true" />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-0)', display: 'block' }}>
                      Treino concluído
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-1)' }}>
                      {finalizadoEm ? `Sessão finalizada às ${new Date(finalizadoEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : 'Histórico registrado com sucesso.'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleIniciarProximoTreino}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.35rem', fontSize: '0.78rem', height: '34px', padding: '0 0.8rem' }}
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  <span>Iniciar Próxima Sessão</span>
                </button>
              </div>
            )}

            {/* Ficha Observation */}
            {activeFicha?.observacao && (
              <div className="card" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', backgroundColor: 'var(--bg-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-m)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <Info size={15} style={{ color: 'var(--accent-text)', flexShrink: 0, marginTop: '2px' }} aria-hidden="true" />
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-0)', lineHeight: '1.45' }}>
                    {activeFicha.observacao}
                  </p>
                </div>
              </div>
            )}

            {/* Exercises List — Tactile iOS Pro with Manual Set Progression */}
            <div className="exercise-stack" style={{ gap: '1rem' }}>
              {sortedExercicios.length > 0 ? (
                sortedExercicios.map((item, index) => {
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
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>
                            EXERCÍCIO {String(index + 1).padStart(2, '0')}
                          </div>
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
                              <span className="badge badge-accent" style={{ fontSize: '0.6875rem', height: '20px', padding: '0 0.5rem', fontWeight: 700 }}>
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
                              aria-label={`Iniciar tempo de descanso de ${formatDescanso(item.descansoSegundos, item.descansoMaxSegundos)}`}
                              title="Iniciar descanso manual"
                            >
                              <Timer size={12} aria-hidden="true" />
                              <span>{formatDescanso(item.descansoSegundos, item.descansoMaxSegundos)}</span>
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
                        {isAtual && <span style={{ fontVariantNumeric: 'tabular-nums' }}>{completedSetsCount} de {sets.length} concluídas</span>}
                      </div>

                      {isAtual && (<>
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
                          <History size={12} style={{ color: 'var(--accent-text)', flexShrink: 0 }} aria-hidden="true" />
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
                            className="set-add-btn"
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

                          {sets.length > (item.series || 3) && (
                            <button
                              type="button"
                              onClick={() => removeExtraSet(item, sets)}
                              style={{
                                padding: '0.45rem 0.65rem',
                                border: '1px dashed var(--border-strong)',
                                borderRadius: 'var(--radius-s)',
                                background: 'transparent',
                                color: 'var(--text-2)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                              aria-label="Remover última série adicionada"
                            >
                              <span>− Remover série</span>
                            </button>
                          )}

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
                      </>)}
                    </div>
                  );
                })
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
                  Nenhum exercício prescrito nesta ficha.
                </div>
              )}
            </div>

            <RodapeTreino texto={rodapeEfetivo(activeFicha?.rodape, profissional.rodapeTreino)} variant="screen" />

            {/* Action Bar: Encerrar Treino / Treino Finalizado */}
            {isAtual && sortedExercicios.length > 0 && (
              sessaoConcluida ? (
                <div className="workout-completed-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <CheckCircle2 size={24} style={{ color: 'var(--success-text)', flexShrink: 0 }} aria-hidden="true" />
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: 'var(--text-0)', display: 'block' }}>
                        Treino finalizado
                      </strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-1)' }}>
                        Cargas e repetições salvas como referência para sua próxima sessão.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleIniciarProximoTreino}
                    className="btn btn-primary"
                    style={{ gap: '0.45rem', padding: '0.65rem 1.1rem', fontWeight: 700, fontSize: '0.85rem' }}
                  >
                    <RotateCcw size={16} aria-hidden="true" />
                    <span>Iniciar Próxima Sessão</span>
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
                      padding: '0.75rem 1.5rem',
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      borderRadius: 'var(--radius-m)',
                      boxShadow: '0 4px 18px var(--accent-soft)',
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

            <MeuProgresso progresso={progresso} idTreino={activeTabId} />

            <VolumeSemanal fichas={sortedTreinos} idFichaAtual={activeTabId} />
          <TabelaProgressao variant="screen" />
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
            Nenhum treino ativo disponível. Fale com seu treinador.
          </div>
        )}
      </main>

      {/* Aviso de séries que não chegaram ao servidor */}
      <div aria-live="polite">
        {temPendentes && (
          <div className="sync-pendente-aviso" role="status">
            <AlertCircle size={18} aria-hidden="true" />
            <span>
              {reenviando
                ? 'Salvando suas séries…'
                : 'Algumas séries não foram salvas. Elas estão guardadas neste aparelho e serão enviadas quando a conexão voltar.'}
            </span>
            <button type="button" onClick={() => reenviarPendentes()} disabled={reenviando}>
              Tentar agora
            </button>
          </div>
        )}
      </div>

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
            <span style={{ fontSize: '1.35rem', fontWeight: 800, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums', color: 'var(--accent-text)', letterSpacing: '-0.02em' }}>
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </span>
            <button 
              onClick={stopTimer} 
              className="btn btn-secondary btn-sm"
              style={{ height: '44px', minWidth: '56px', fontSize: '0.8rem', fontWeight: 600 }}
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

      {/* Instalar no iPhone: o Safari não tem botão de instalar, só o menu Compartilhar */}
      {showIosHint && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setShowIosHint(false)} role="dialog" aria-modal="true" aria-label="Como instalar o app no iPhone">
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ textAlign: 'center' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'var(--accent-dim)',
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Smartphone size={24} aria-hidden="true" />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Instalar no iPhone</h3>
              <p style={{ color: 'var(--text-1)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                Toque em <strong>Compartilhar</strong> na barra do Safari e depois em{' '}
                <strong>"Adicionar à Tela de Início"</strong>.
              </p>
              <p style={{ color: 'var(--text-1)', fontSize: '0.8rem', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Ao abrir o app pela primeira vez, entre de novo com seu telefone e PIN.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowIosHint(false)}
                style={{ width: '100%', height: '44px' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Confirmação para Encerrar Treino */}
      {showConfirmModal && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setShowConfirmModal(false)} role="alertdialog" aria-modal="true" aria-labelledby="modalEncerrarTreinoTitulo">
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.75rem' }}>
                <AlertCircle size={22} style={{ color: 'var(--accent-text)', flexShrink: 0 }} aria-hidden="true" />
                <h3 id="modalEncerrarTreinoTitulo" style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-0)' }}>Encerrar Treino?</h3>
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
        </ModalPortal>
      )}

      {/* Modal de Celebração de Treino Encerrado */}
      {showCelebrationModal && (
        <ModalPortal>
          <div className="modal-backdrop" onClick={() => setShowCelebrationModal(false)} role="dialog" aria-modal="true" aria-label="Treino concluído">
            <div className="modal-content" style={{ textAlign: 'center', padding: '2rem 1.5rem' }} onClick={e => e.stopPropagation()}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '50%', 
                backgroundColor: 'rgba(45, 168, 104, 0.12)', 
                color: 'var(--success-text)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <CheckCircle2 size={34} strokeWidth={2.2} aria-hidden="true" />
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-0)', marginBottom: '0.35rem', letterSpacing: '-0.02em' }}>
                Treino finalizado
              </h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-1)', marginBottom: '1.5rem', lineHeight: 1.45 }}>
                Excelente treino! Suas cargas e repetições foram salvas no histórico. Na próxima sessão, elas aparecerão como referência na coluna <strong>Anterior</strong> para guiar sua progressão.
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
                  <strong style={{ fontSize: '1.3rem', color: 'var(--accent-text)', fontVariantNumeric: 'tabular-nums' }}>{completedExercisesCount}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={handleIniciarProximoTreino}
                  className="btn btn-primary"
                  style={{ width: '100%', height: '46px', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                >
                  <RotateCcw size={16} aria-hidden="true" />
                  <span>Iniciar Próxima Sessão</span>
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
        </ModalPortal>
      )}
    </div>
  );
};
