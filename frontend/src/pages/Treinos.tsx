import React, { useEffect, useState } from 'react';
import { PainelProgresso } from '../components/Progresso';
import type { Progresso } from '../utils/progresso';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Reorder, useDragControls } from 'motion/react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Breadcrumb } from '../components/Breadcrumb';
import {
  ArrowLeft, Plus,
  Trash2, AlertCircle,
  ArrowUp, ArrowDown, Edit, Edit2, Share2, X, Save, FileText, GripVertical, Timer, MessageSquareText
} from 'lucide-react';
import { memoryCache } from '../services/cache';
import { InstrucaoAutocomplete, type Instrucao } from '../components/InstrucaoAutocomplete';
import { parseDescanso, formatDescanso, descansoParaInput } from '../utils/descanso';
import { FichaPdf } from '../components/FichaPdf';
import { baixarPdfDoTreino } from '../utils/pdf';
import type { GrupoMuscular, Exercicio, TecnicaTreino, PrescribedExercise, FichaTreino, Protocolo } from '../types/treino';

interface Aluno {
  idAluno: number;
  nome: string;
  email: string;
  tokenAcesso?: string;
}

// Cache em memória para catálogos estáticos
let cachedCatalogs: {
  exercicios: Exercicio[];
  tecnicas: TecnicaTreino[];
  grupos: GrupoMuscular[];
} | null = null;

interface ExerciseBlockRowProps {
  item: PrescribedExercise;
  index: number;
  total: number;
  onMove: (direction: 'up' | 'down') => void;
  onEdit: () => void;
  onRemove: () => void;
}

// Item isolado por precisar do próprio useDragControls (hooks não rodam dentro de .map())
const ExerciseBlockRow: React.FC<ExerciseBlockRowProps> = ({ item, index, total, onMove, onEdit, onRemove }) => {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={item}
      as="div"
      dragListener={false}
      dragControls={dragControls}
      className="exercise-block"
      // Ao arrastar o cartão "levanta": escala leve + sombra, com mola sem quique
      whileDrag={{ scale: 1.015, boxShadow: '0 14px 36px rgba(0, 0, 0, 0.22)', zIndex: 5 }}
      transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
    >
      <div
        className="exercise-block-handle"
        onPointerDown={(e) => dragControls.start(e)}
        title="Arraste para reordenar"
      >
        <GripVertical size={16} />
        <button className="exercise-action-btn" disabled={index === 0} onClick={() => onMove('up')}>
          <ArrowUp size={14} />
        </button>
        <button className="exercise-action-btn" disabled={index === total - 1} onClick={() => onMove('down')}>
          <ArrowDown size={14} />
        </button>
      </div>
      <span className="exercise-block-index" aria-hidden="true">
        {String(index + 1).padStart(2, '0')}
      </span>
      <div className="exercise-block-info">
        <div className="exercise-block-name">{item.exercicio.nome}</div>
        <div className="exercise-block-detail">
          <span className="exercise-block-tag">{item.exercicio.grupoMuscular.nome}</span>
          {item.tecnica && <span className="exercise-block-tag tecnica">{item.tecnica.nome}</span>}
          {item.observacao && (
            <span className="exercise-block-note">
              <MessageSquareText size={12} aria-hidden="true" />
              {item.observacao}
            </span>
          )}
        </div>
      </div>
      <div className="exercise-block-stats">
        <span className="exercise-block-stat">
          {item.series}<span className="exercise-block-stat-label">×</span>{item.repeticoes}
        </span>
        {item.descansoSegundos && (
          <span className="exercise-block-rest">
            <Timer size={12} aria-hidden="true" />
            {formatDescanso(item.descansoSegundos, item.descansoMaxSegundos)}
          </span>
        )}
      </div>
      <div className="exercise-block-actions">
        <button className="exercise-action-btn accent" onClick={onEdit} title="Editar">
          <Edit size={14} />
        </button>
        <button className="exercise-action-btn danger" onClick={onRemove} title="Remover">
          <Trash2 size={14} />
        </button>
      </div>
    </Reorder.Item>
  );
};

export const Treinos: React.FC = () => {
  const { idAluno } = useParams<{ idAluno: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const idProtocolo = searchParams.get('periodizacao');
  const { user } = useAuth();

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [activeProtocol, setActiveProtocol] = useState<Protocolo | null>(null);

  // Catalogs
  const [catalogExercicios, setCatalogExercicios] = useState<Exercicio[]>(cachedCatalogs?.exercicios || []);
  const [catalogTecnicas, setCatalogTecnicas] = useState<TecnicaTreino[]>(cachedCatalogs?.tecnicas || []);
  const [catalogInstrucoes, setCatalogInstrucoes] = useState<Instrucao[]>([]);
  const [catalogGrupos, setCatalogGrupos] = useState<GrupoMuscular[]>(cachedCatalogs?.grupos || []);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // --- MODAL STATES ---
  const [showTreinoModal, setShowTreinoModal] = useState(false);
  const [showEditFichaModal, setShowEditFichaModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // --- PRINT / PDF EXPORT STATES ---
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [abaView, setAbaView] = useState<'fichas' | 'progresso'>('fichas');
  const [progresso, setProgresso] = useState<Progresso | null>(null);
  const [printScope, setPrintScope] = useState<'all' | 'current'>('all');
  const [printPagePerFicha, setPrintPagePerFicha] = useState(true);
  const [printGuidelines, setPrintGuidelines] = useState(false);

  // Edit Ficha state
  const [editingFichaId, setEditingFichaId] = useState<number | null>(null);
  const [editFichaNome, setEditFichaNome] = useState('');
  const [editFichaObs, setEditFichaObs] = useState('');
  const [editFichaRodape, setEditFichaRodape] = useState('');
  const [editFichaSemRodape, setEditFichaSemRodape] = useState(false);

  // New Ficha (Treino) inputs
  const [treinoNome, setTreinoNome] = useState('');
  const [treinoObs, setTreinoObs] = useState('');
  const [treinoOrdem, setTreinoOrdem] = useState(1);

  // Prescribe Exercise inputs
  const [editingExercisePrescriptionId, setEditingExercisePrescriptionId] = useState<number | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<number>(0);
  const [selectedExercicio, setSelectedExercicio] = useState<number>(0);
  const [selectedTecnica, setSelectedTecnica] = useState<number | undefined>(undefined);
  const [exSeries, setExSeries] = useState(3);
  const [exReps, setExReps] = useState('10');
  const [exDescanso, setExDescanso] = useState('60');
  const [exObs, setExObs] = useState('');

  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const cancelEdit = () => {
    setEditingExercisePrescriptionId(null);
    setSelectedGrupo(0);
    setSelectedExercicio(0);
    setSelectedTecnica(undefined);
    setExSeries(3);
    setExReps('10');
    setExDescanso('60');
    setExObs('');
  };

  // Modal helpers
  const closeTreinoModal = () => {
    setShowTreinoModal(false);
    setTreinoNome('');
    setTreinoObs('');
  };
  const closeEditFichaModal = () => {
    setShowEditFichaModal(false);
    setEditingFichaId(null);
    setEditFichaNome('');
    setEditFichaObs('');
  };
  const closeExerciseModal = () => {
    setShowExerciseModal(false);
    cancelEdit();
  };
  const openNewExerciseModal = () => {
    cancelEdit();
    setShowExerciseModal(true);
  };

  const handleTriggerPrint = () => {
    setShowPrintModal(false);
    baixarPdfDoTreino(aluno?.nome);
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowTreinoModal(false);
        setShowEditFichaModal(false);
        setShowExerciseModal(false);
        setShowPrintModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleShare = () => {
    const token = activeProtocol?.tokenPublico || aluno?.tokenAcesso;
    if (token) {
      const url = `${window.location.origin}/v/${token}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast.success('Link desta periodização copiado!');
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  // Progresso de cargas: carregado ao abrir a aba (sempre atualizado)
  const idProtocoloAtivo = activeProtocol?.idProtocolo;
  useEffect(() => {
    if (abaView !== 'progresso' || !idProtocoloAtivo) return;
    let cancelado = false;
    api.get(`/treinos/progresso/${idProtocoloAtivo}`)
      .then((res) => { if (!cancelado) setProgresso(res.data); })
      .catch((err) => {
        console.error('Erro ao carregar progresso:', err);
        if (!cancelado) toast.error('Não foi possível carregar o progresso do aluno.');
      });
    return () => { cancelado = true; };
  }, [abaView, idProtocoloAtivo]);

  // Auto-select first tab when activeProtocol changes if none is selected or current no longer exists
  useEffect(() => {
    if (activeProtocol && activeProtocol.treinos.length > 0) {
      const stillExists = activeProtocol.treinos.some(t => t.idTreino === activeTabId);
      if (!stillExists) {
        const sorted = [...activeProtocol.treinos].sort((a, b) => a.ordem - b.ordem);
        setActiveTabId(sorted[0].idTreino);
      }
    } else {
      setActiveTabId(null);
    }
  }, [activeProtocol, activeTabId]);

  // Carrega catálogos (com cache instantâneo)
  const loadCatalogs = async () => {
    // Instruções mudam com frequência na biblioteca; busca sempre (payload pequeno)
    api.get('/exercicios/instrucoes')
      .then((res) => setCatalogInstrucoes(res.data))
      .catch((err) => console.error('Erro ao carregar instruções:', err));
    if (cachedCatalogs) {
      setCatalogExercicios(cachedCatalogs.exercicios);
      setCatalogTecnicas(cachedCatalogs.tecnicas);
      setCatalogGrupos(cachedCatalogs.grupos);
      return;
    }
    try {
      const [exerciciosRes, tecnicasRes, gruposRes] = await Promise.all([
        api.get('/exercicios'),
        api.get('/exercicios/tecnicas'),
        api.get('/exercicios/grupos')
      ]);
      cachedCatalogs = {
        exercicios: exerciciosRes.data,
        tecnicas: tecnicasRes.data,
        grupos: gruposRes.data,
      };
      setCatalogExercicios(exerciciosRes.data);
      setCatalogTecnicas(tecnicasRes.data);
      setCatalogGrupos(gruposRes.data);
    } catch (err) {
      console.error('Erro ao carregar catálogo:', err);
    }
  };

  // Carrega o aluno + a periodização específica indicada em ?periodizacao=
  const loadTreino = async (showGlobalLoading = false) => {
    try {
      if (showGlobalLoading) setLoading(true);
      else setRefreshing(true);
      setError('');

      const [alunoRes, protocoloRes] = await Promise.all([
        api.get(`/alunos/${idAluno}`),
        api.get(`/treinos/protocolos/detalhes/${idProtocolo}`),
        loadCatalogs(),
      ]);

      setAluno(alunoRes.data);
      setActiveProtocol(protocoloRes.data);
      if (idAluno && idProtocolo) {
        memoryCache.set(`treino-detalhe-${idProtocolo}`, { aluno: alunoRes.data, protocolo: protocoloRes.data });
      }
    } catch (err) {
      console.error('Erro ao carregar dados da periodização:', err);
      setError('Erro ao carregar dados da periodização.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Toda visita a um aluno passa pela lista de periodizações primeiro —
  // sem o id da periodização na URL não há o que exibir aqui.
  useEffect(() => {
    if (!idProtocolo) {
      navigate(`/alunos/${idAluno}/periodizacoes`, { replace: true });
      return;
    }

    const cached = memoryCache.get<any>(`treino-detalhe-${idProtocolo}`);
    if (cached) {
      setAluno(cached.aluno);
      setActiveProtocol(cached.protocolo);
      setLoading(false);
      // Revalida em segundo plano sem travar o usuário
      loadTreino(false);
    } else {
      setLoading(true);
      loadTreino(true);
    }
  }, [idAluno, idProtocolo]);

  useEffect(() => {
    if (aluno) {
      document.title = `Treinos - ${aluno.nome} | TreinosApp`;
    } else {
      document.title = 'Prescrever Treino | TreinosApp';
    }
  }, [aluno]);

  // Seeding default catalog helper
  const handleSeedCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      
      const grupos = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
      const grupoIds: Record<string, number> = {};
      
      for (const g of grupos) {
        const res = await api.post('/exercicios/grupos', { nome: g });
        grupoIds[g] = res.data.idGrupoMuscular;
      }

      const exercicios = [
        { nome: 'Supino reto', grupo: 'Peito' },
        { nome: 'Supino inclinado c/ halteres', grupo: 'Peito' },
        { nome: 'Crossover polia alta', grupo: 'Peito' },
        { nome: 'Puxada aberta na frente', grupo: 'Costas' },
        { nome: 'Remada curvada', grupo: 'Costas' },
        { nome: 'Agachamento livre', grupo: 'Pernas' },
        { nome: 'Leg press 45', grupo: 'Pernas' },
        { nome: 'Cadeira extensora', grupo: 'Pernas' },
        { nome: 'Desenvolvimento c/ halteres', grupo: 'Ombros' },
        { nome: 'Elevação lateral', grupo: 'Ombros' },
        { nome: 'Rosca direta polia', grupo: 'Braços' },
        { nome: 'Tríceps corda', grupo: 'Braços' },
        { nome: 'Abdominal supra', grupo: 'Core' },
        { nome: 'Prancha isométrica', grupo: 'Core' },
      ];

      for (const ex of exercicios) {
        await api.post('/exercicios', {
          nome: ex.nome,
          idGrupoMuscular: grupoIds[ex.grupo]
        });
      }

      const tecnicas = [
        { nome: 'Drop-set', desc: 'Realiza falha, reduz carga 20-30%, falha novamente sem descanso.' },
        { nome: 'Rest-pause', desc: 'Descansar 10-20 segundos e continuar até a falha.' },
        { nome: 'Bi-set', desc: 'Fazer dois exercícios conjugados' },
        { nome: 'Super-set', desc: 'Dois exercícios para grupos musculares antagonistas, feitos em sequência, normalmente com pouco ou nenhum descanso entre eles.' },
        { nome: 'Cluster set', desc: 'Divide a série em blocos menores com pausas mais longas entre eles, priorizando manter força e qualidade das repetições. Ex.: 2 + 2 + 2 + 2.' },
        { nome: 'Myo-reps', desc: 'Série de ativação próxima da falha seguida de mini-séries curtas com pausas breves — alto estímulo com pouco volume e tempo.' },
        { nome: 'Back-off set', desc: 'Depois de uma série pesada, reduz a carga e faz mais repetições. Ex.: 6 reps pesadas → reduz 15% → 10 reps.' },
        { nome: 'Muscle rounds', desc: 'Divide uma série pesada em vários mini-blocos de repetições, com descansos de ~10-15s. Ex.: 4 + 4 + 4 + 4 + 4.' },
      ];

      for (const t of tecnicas) {
        await api.post('/exercicios/tecnicas', { nome: t.nome, descricao: t.desc });
      }

      cachedCatalogs = null; // Invalida cache
      await loadTreino(true);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao gerar catálogo padrão. Talvez alguns nomes já existam.');
    } finally {
      setLoading(false);
    }
  };

  // Ficha operations (com adição instantânea)
  const handleCreateTreino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProtocol) return;
    if (!treinoNome.trim()) {
      toast.error('Informe o nome da ficha de treino.');
      return;
    }

    try {
      const res = await api.post(`/treinos/fichas/${activeProtocol.idProtocolo}`, {
        nome: treinoNome.trim(),
        observacao: treinoObs.trim() || undefined,
        ordem: Number(treinoOrdem)
      });

      const newTreino: FichaTreino = {
        idTreino: res.data.idTreino,
        nome: res.data.nome,
        observacao: res.data.observacao,
        ordem: res.data.ordem,
        exercicios: [],
      };

      setActiveProtocol(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          treinos: [...prev.treinos, newTreino],
        };
      });

      setActiveTabId(newTreino.idTreino);
      closeTreinoModal();
      toast.success('Ficha de treino criada com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar ficha de treino.');
    }
  };

  // Ficha update (renomear / editar observação)
  const handleUpdateTreino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFichaId || !activeProtocol) return;
    if (!editFichaNome.trim()) {
      toast.error('Informe o nome da ficha.');
      return;
    }

    const targetId = editingFichaId;
    const newNome = editFichaNome.trim();
    const newObs = editFichaObs.trim();
    // null = herda o padrão do treinador; "" = sem rodapé nesta ficha
    const newRodape = editFichaSemRodape ? '' : editFichaRodape.trim() || null;

    // Optimistic UI
    setActiveProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treinos: prev.treinos.map(t =>
          t.idTreino === targetId ? { ...t, nome: newNome, observacao: newObs || undefined, rodape: newRodape } : t
        ),
      };
    });

    closeEditFichaModal();
    toast.success('Ficha atualizada com sucesso!');

    try {
      await api.patch(`/treinos/fichas/${targetId}`, {
        nome: newNome,
        observacao: newObs || null,
        rodape: newRodape,
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar alterações da ficha.');
      loadTreino(false);
    }
  };

  // Ficha delete
  const handleDeleteTreino = async (idTreino: number, nome: string) => {
    if (!confirm(`Deseja excluir a ficha "${nome}" e todos os seus exercícios?`)) return;
    if (!activeProtocol) return;

    // Optimistic UI
    const remaining = activeProtocol.treinos.filter(t => t.idTreino !== idTreino);
    setActiveProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treinos: remaining,
      };
    });

    if (activeTabId === idTreino) {
      const sorted = [...remaining].sort((a, b) => a.ordem - b.ordem);
      setActiveTabId(sorted.length > 0 ? sorted[0].idTreino : null);
    }

    toast.success('Ficha excluída.');

    try {
      await api.delete(`/treinos/fichas/${idTreino}`);
      loadTreino(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir ficha no servidor.');
      loadTreino(false);
    }
  };

  const handleSaveInstrucao = async (texto: string) => {
    try {
      const res = await api.post('/exercicios/instrucoes', { texto });
      setCatalogInstrucoes((prev) => [...prev, res.data].sort((a, b) => a.texto.localeCompare(b.texto)));
      toast.success('Instrução salva na biblioteca!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao salvar instrução.');
    }
  };

  // Prescribe Exercise operations com Optimistic UI instantâneo
  const handlePrescribeExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTabId || !activeProtocol) return;

    const exObj = catalogExercicios.find(e => e.idExercicio === Number(selectedExercicio));
    const tecObj = catalogTecnicas.find(t => t.idTecnica === Number(selectedTecnica));
    if (!exObj) {
      toast.error('Por favor, selecione um exercício.');
      return;
    }

    const descanso = exDescanso.trim() ? parseDescanso(exDescanso) : null;
    if (exDescanso.trim() && !descanso) {
      toast.error('Descanso inválido. Use por exemplo 60, 60-90 ou 1-3 min.');
      return;
    }

    const currentFicha = activeProtocol.treinos.find(t => t.idTreino === activeTabId);

    if (editingExercisePrescriptionId) {
      // --- EDIÇÃO OTIMISTA INSTANTÂNEA ---
      const editId = editingExercisePrescriptionId;
      const oldItem = currentFicha?.exercicios.find(x => x.idTreinoExercicio === editId);

      const updatedItem: PrescribedExercise = {
        idTreinoExercicio: editId,
        series: Number(exSeries),
        repeticoes: String(exReps),
        descansoSegundos: descanso?.min ?? 60,
        descansoMaxSegundos: descanso?.max,
        observacao: exObs || undefined,
        ordem: oldItem?.ordem || 1,
        exercicio: exObj,
        tecnica: tecObj,
      };

      // Atualiza tela imediatamente (0ms)
      setActiveProtocol(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          treinos: prev.treinos.map(t => {
            if (t.idTreino !== activeTabId) return t;
            return {
              ...t,
              exercicios: t.exercicios.map(x => x.idTreinoExercicio === editId ? updatedItem : x),
            };
          }),
        };
      });

      closeExerciseModal();
      toast.success('Exercício atualizado!');

      // Salva no backend em background
      try {
        await api.patch(`/treinos/exercicios/${editId}`, {
          idExercicio: Number(selectedExercicio),
          idTecnica: selectedTecnica ? Number(selectedTecnica) : null,
          series: Number(exSeries),
          repeticoes: exReps,
          descansoSegundos: descanso?.min ?? null,
          descansoMaxSegundos: descanso?.max ?? null,
          observacao: exObs || null,
        });
      } catch (err) {
        console.error('Erro ao salvar edição:', err);
        toast.error('Erro ao salvar no servidor.');
        loadTreino(false);
      }
    } else {
      // --- ADIÇÃO OTIMISTA INSTANTÂNEA ---
      const tempId = -Date.now();
      const newOrder = (currentFicha?.exercicios.length || 0) + 1;
      const newItem: PrescribedExercise = {
        idTreinoExercicio: tempId,
        series: Number(exSeries),
        repeticoes: String(exReps),
        descansoSegundos: descanso?.min ?? 60,
        descansoMaxSegundos: descanso?.max,
        observacao: exObs || undefined,
        ordem: newOrder,
        exercicio: exObj,
        tecnica: tecObj,
      };

      // Adiciona na lista na tela imediatamente (0ms)
      setActiveProtocol(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          treinos: prev.treinos.map(t => {
            if (t.idTreino !== activeTabId) return t;
            return {
              ...t,
              exercicios: [...t.exercicios, newItem],
            };
          }),
        };
      });

      closeExerciseModal();
      toast.success('Exercício adicionado!');

      // Salva no backend em background e sincroniza o ID real
      try {
        const res = await api.post(`/treinos/exercicios/${activeTabId}`, {
          idExercicio: Number(selectedExercicio),
          idTecnica: selectedTecnica ? Number(selectedTecnica) : undefined,
          series: Number(exSeries),
          repeticoes: exReps,
          descansoSegundos: descanso?.min,
          descansoMaxSegundos: descanso?.max,
          observacao: exObs || undefined,
          ordem: newOrder,
        });

        // Substitui ID temporário pelo real do banco
        setActiveProtocol(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            treinos: prev.treinos.map(t => {
              if (t.idTreino !== activeTabId) return t;
              return {
                ...t,
                exercicios: t.exercicios.map(x => x.idTreinoExercicio === tempId ? res.data : x),
              };
            }),
          };
        });
      } catch (err) {
        console.error('Erro ao adicionar exercício:', err);
        toast.error('Erro ao salvar no servidor.');
        loadTreino(false);
      }
    }
  };

  const handleEditPrescription = (item: PrescribedExercise, idTreino: number) => {
    setEditingExercisePrescriptionId(item.idTreinoExercicio);
    setSelectedGrupo(item.exercicio.idGrupoMuscular);
    setSelectedExercicio(item.exercicio.idExercicio);
    setSelectedTecnica(item.tecnica?.idTecnica);
    setExSeries(item.series);
    setExReps(item.repeticoes);
    setExDescanso(descansoParaInput(item.descansoSegundos, item.descansoMaxSegundos) || '60');
    setExObs(item.observacao || '');
    setActiveTabId(idTreino);
    setShowExerciseModal(true);
  };

  // Reordenação otimista instantânea
  const handleMoveExercise = async (treino: FichaTreino, index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= treino.exercicios.length) return;

    const currentEx = treino.exercicios[index];
    const targetEx = treino.exercicios[targetIndex];

    const updatedList = [...treino.exercicios];
    const tempOrdem = currentEx.ordem;
    updatedList[index] = { ...targetEx, ordem: tempOrdem };
    updatedList[targetIndex] = { ...currentEx, ordem: targetEx.ordem };

    // Swap na UI imediatamente (0ms)
    setActiveProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treinos: prev.treinos.map(t => {
          if (t.idTreino !== treino.idTreino) return t;
          return {
            ...t,
            exercicios: updatedList,
          };
        }),
      };
    });

    try {
      await Promise.all([
        api.patch(`/treinos/exercicios/${currentEx.idTreinoExercicio}`, { ordem: targetEx.ordem }),
        api.patch(`/treinos/exercicios/${targetEx.idTreinoExercicio}`, { ordem: currentEx.ordem })
      ]);
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      loadTreino(false);
    }
  };

  // Reordenação via drag-and-drop — recebe a lista já na nova ordem
  const handleReorderExercises = async (treino: FichaTreino, newOrder: PrescribedExercise[]) => {
    const updatedList = newOrder.map((ex, idx) => ({ ...ex, ordem: idx + 1 }));

    setActiveProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treinos: prev.treinos.map(t =>
          t.idTreino === treino.idTreino ? { ...t, exercicios: updatedList } : t
        ),
      };
    });

    try {
      await Promise.all(
        updatedList.map((ex, idx) =>
          api.patch(`/treinos/exercicios/${ex.idTreinoExercicio}`, { ordem: idx + 1 })
        )
      );
    } catch (err) {
      console.error('Erro ao reordenar:', err);
      loadTreino(false);
    }
  };

  // Remoção otimista instantânea
  const handleRemoveExercise = async (idTreinoExercicio: number) => {
    if (!confirm('Deseja excluir esta prescrição?')) return;
    if (!activeProtocol || !activeTabId) return;

    // Remove da tela imediatamente (0ms)
    setActiveProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treinos: prev.treinos.map(t => {
          if (t.idTreino !== activeTabId) return t;
          return {
            ...t,
            exercicios: t.exercicios.filter(x => x.idTreinoExercicio !== idTreinoExercicio),
          };
        }),
      };
    });

    try {
      await api.delete(`/treinos/exercicios/${idTreinoExercicio}`);
    } catch (err) {
      console.error('Erro ao remover no servidor:', err);
      loadTreino(false);
    }
  };

  if (loading && !aluno) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Skeleton */}
        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-s)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div className="skeleton" style={{ width: '180px', height: '26px' }} />
              <div className="skeleton" style={{ width: '120px', height: '14px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '90px', height: '32px' }} />
            <div className="skeleton" style={{ width: '80px', height: '32px' }} />
          </div>
        </div>

        {/* Ficha Tabs Skeleton */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: 'var(--radius-m)' }} />
          <div className="skeleton" style={{ width: '110px', height: '36px', borderRadius: 'var(--radius-m)' }} />
          <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-m)' }} />
        </div>

        {/* Exercises Stack Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="skeleton" style={{ height: '70px', borderRadius: 'var(--radius-l)' }} />
          ))}
        </div>
      </div>
    );
  }

  if (!aluno && error) {
    return (
      <div className="card animate-in" style={{ textAlign: 'center', padding: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <AlertCircle size={36} style={{ color: 'var(--danger)' }} />
        <h2>Aluno não encontrado</h2>
        <p style={{ color: 'var(--text-1)', maxWidth: '400px' }}>
          Este aluno não existe no banco de dados atual. Acesse a lista de alunos para cadastrar um novo ou selecionar um existente.
        </p>
        <Link to="/alunos" className="btn btn-primary btn-sm">
          Ir para Meus Alunos
        </Link>
      </div>
    );
  }

  const sortedTreinos = activeProtocol ? [...activeProtocol.treinos].sort((a, b) => a.ordem - b.ordem) : [];
  const activeFicha = activeProtocol?.treinos.find(t => t.idTreino === activeTabId);
  const sortedExercicios = activeFicha ? [...activeFicha.exercicios].sort((a, b) => a.ordem - b.ordem) : [];

  // Print calculations & formatting
  const currentFicha = activeFicha || sortedTreinos[0];
  const treinosToPrint = (printScope === 'current' && currentFicha) 
    ? [currentFicha] 
    : sortedTreinos;

  const volumeSemanalPorGrupo = (() => {
    const acc: Record<string, number> = {};
    activeProtocol?.treinos.forEach((t) => {
      t.exercicios?.forEach((item) => {
        const grupo = item.exercicio.grupoMuscular?.nome || 'Outro';
        acc[grupo] = (acc[grupo] || 0) + (Number(item.series) || 0);
      });
    });
    return Object.entries(acc).sort((a, b) => b[1] - a[1]);
  })();

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Screen Interactive UI Wrapper (Hidden during print) */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Section */}
        <div>
          <Breadcrumb items={[
            { label: 'Alunos', to: '/alunos' },
            { label: aluno?.nome || '...', to: `/alunos/${idAluno}/periodizacoes` },
            { label: 'Periodizações', to: `/alunos/${idAluno}/periodizacoes` },
            { label: activeProtocol?.nome || '...' },
          ]} />
          <div className="flex-between" style={{ flexWrap: 'wrap', rowGap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to={`/alunos/${idAluno}/periodizacoes`} className="btn btn-ghost btn-icon">
                <ArrowLeft size={18} />
              </Link>
              <div>
                <h1>{aluno?.nome}</h1>
                <p>
                  {activeProtocol?.nome || 'Carregando periodização...'}
                  {activeProtocol?.objetivo && (
                    <span style={{ color: 'var(--text-2)', margin: '0 0.35rem' }}>|</span>
                  )}{activeProtocol?.objetivo}
                  {refreshing && <span style={{ color: 'var(--text-2)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>Atualizando...</span>}
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {(activeProtocol?.tokenPublico || aluno?.tokenAcesso) && (
                <button className="btn btn-secondary btn-sm" onClick={handleShare}>
                  <Share2 size={14} />
                  {shareCopied ? 'Copiado!' : 'Compartilhar'}
                </button>
              )}
              {activeProtocol && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPrintModal(true)}>
                  <FileText size={14} />
                  Gerar PDF
                </button>
              )}
            </div>
          </div>
        </div>

      {/* Error display */}
      {error && (
        <div className="badge" style={{ display: 'block', padding: '0.75rem', textAlign: 'center', backgroundColor: 'rgba(255,80,80,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Empty Catalog Warning */}
      {catalogExercicios.length === 0 && (
        <div className="card" style={{ border: '1px solid var(--warning)', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
          <h2 style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={22} />
            Catálogo de Exercícios Vazio
          </h2>
          <p>
            Percebemos que você não possui nenhum exercício cadastrado no sistema ainda. Para começar a prescrever treinos imediatamente, podemos preencher seu catálogo com dados padrão.
          </p>
          <button className="btn btn-primary" onClick={handleSeedCatalog}>
            Gerar Catálogo Padrão
          </button>
        </div>
      )}

      {/* Fichas | Progresso */}
      {activeProtocol && (
        <div className="view-switch" role="tablist" aria-label="Visualização da periodização">
          <button type="button" role="tab" aria-selected={abaView === 'fichas'} onClick={() => setAbaView('fichas')}>
            Fichas
          </button>
          <button type="button" role="tab" aria-selected={abaView === 'progresso'} onClick={() => { setProgresso(null); setAbaView('progresso'); }}>
            Progresso
          </button>
        </div>
      )}

      {activeProtocol && abaView === 'progresso' && <PainelProgresso progresso={progresso} />}

      {/* Ficha Tabs */}
      {activeProtocol && abaView === 'fichas' && (
        <>
          <div className="ficha-tabs">
            {sortedTreinos.map((treino) => (
              <button
                key={treino.idTreino}
                className={`ficha-tab ${activeTabId === treino.idTreino ? 'active' : ''}`}
                onClick={() => {
                  setActiveTabId(treino.idTreino);
                  setEditingFichaId(null);
                  cancelEdit();
                }}
              >
                {treino.nome}
              </button>
            ))}
            <button
              className="ficha-tab ficha-tab-add"
              onClick={() => {
                setTreinoNome('');
                setTreinoObs('');
                setTreinoOrdem(activeProtocol.treinos.length + 1);
                setShowTreinoModal(true);
              }}
              title="Nova Ficha de Treino"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Active Ficha Content */}
          {activeFicha ? (
            <>
              {/* Active Ficha Toolbar (Adicionar / Renomear / Excluir Ficha) */}
              <div className="flex-between" style={{ alignItems: 'center', marginBottom: '0.75rem', padding: '0.25rem 0', flexWrap: 'wrap', rowGap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                    {activeFicha.nome}
                  </h3>
                  {activeFicha.observacao && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>
                      • {activeFicha.observacao}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={openNewExerciseModal}
                    title="Adicionar exercício à ficha"
                  >
                    <Plus size={13} />
                    <span style={{ fontSize: '0.75rem' }}>Exercício</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingFichaId(activeFicha.idTreino);
                      setEditFichaNome(activeFicha.nome);
                      setEditFichaObs(activeFicha.observacao || '');
                      setEditFichaRodape(activeFicha.rodape || '');
                      setEditFichaSemRodape(activeFicha.rodape === '');
                      setShowEditFichaModal(true);
                    }}
                    title="Renomear / Editar ficha"
                  >
                    <Edit2 size={13} />
                    <span style={{ fontSize: '0.75rem' }}>Renomear</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--danger)' }}
                    onClick={() => handleDeleteTreino(activeFicha.idTreino, activeFicha.nome)}
                    title="Excluir ficha de treino"
                  >
                    <Trash2 size={13} />
                    <span style={{ fontSize: '0.75rem' }}>Excluir Ficha</span>
                  </button>
                </div>
              </div>

              {/* Exercise Stack */}
              {sortedExercicios.length > 0 ? (
                <Reorder.Group
                  as="div"
                  axis="y"
                  values={sortedExercicios}
                  onReorder={(newOrder) => handleReorderExercises(activeFicha, newOrder)}
                  className="exercise-stack"
                >
                  {sortedExercicios.map((item, idx) => (
                    <ExerciseBlockRow
                      key={item.idTreinoExercicio}
                      item={item}
                      index={idx}
                      total={sortedExercicios.length}
                      onMove={(direction) => handleMoveExercise(activeFicha, idx, direction)}
                      onEdit={() => handleEditPrescription(item, activeFicha.idTreino)}
                      onRemove={() => handleRemoveExercise(item.idTreinoExercicio)}
                    />
                  ))}
                </Reorder.Group>
              ) : (
                <div className="exercise-stack">
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <p style={{ margin: 0 }}>Nenhum exercício prescrito nesta ficha ainda.</p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={openNewExerciseModal}>
                      <Plus size={14} />
                      Prescrever Primeiro Exercício
                    </button>
                  </div>
                </div>
              )}

              {/* Add Exercise Action Button */}
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  border: '1px dashed var(--border-strong)',
                  borderRadius: 'var(--radius-m)',
                  background: 'var(--bg-1)',
                  color: 'var(--text-0)',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 150ms var(--ease-out)',
                  marginTop: '0.5rem'
                }}
                onClick={openNewExerciseModal}
              >
                <Plus size={16} style={{ color: 'var(--accent)' }} />
                <span>Adicionar Exercício à Ficha</span>
              </button>

              {/* Volume Footer */}
              {volumeSemanalPorGrupo.length > 0 && (
                <div className="volume-footer" style={{ alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-1)', fontSize: '0.8rem', fontWeight: 600, marginRight: '0.25rem' }}>
                    Volume semanal:
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {volumeSemanalPorGrupo.map(([grupo, series]) => (
                      <span 
                        key={grupo} 
                        className="badge" 
                        style={{ 
                          backgroundColor: 'var(--bg-3)', 
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
            activeProtocol.treinos.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-2)' }}>
                Crie sua primeira ficha (Treino A, B...) para começar a prescrever exercícios.
              </div>
            )
          )}
        </>
      )}

      {/* Periodização não encontrada (ex: link antigo, ou excluída por outra aba) */}
      {!activeProtocol && !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <AlertCircle size={32} style={{ color: 'var(--text-2)', opacity: 0.6 }} />
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-1)' }}>
            Esta periodização não foi encontrada.
          </p>
          <Link to={`/alunos/${idAluno}/periodizacoes`} className="btn btn-primary btn-sm">
            Voltar às periodizações
          </Link>
        </div>
      )}

      </div>

      {/* ========================================================================= */}
      {/* PRINT VIEW FOR WINDOW.PRINT() / SALVAR COMO PDF */}
      {/* ========================================================================= */}
      {activeProtocol && aluno && (
        <FichaPdf
          profissional={user}
          aluno={aluno}
          protocolo={activeProtocol}
          fichas={treinosToPrint}
          paginaPorFicha={printPagePerFicha}
          mostrarRodape={printGuidelines}
        />
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: NOVA FICHA DE TREINO */}
      {/* ========================================================================= */}
      {showTreinoModal && (
        <div 
          className="modal-backdrop" 
          onClick={closeTreinoModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTreinoTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    ORGANIZAÇÃO // NOVA FICHA
                  </span>
                </div>
                <h3 id="modalTreinoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Nova Ficha de Treino
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeTreinoModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateTreino} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="treinoNomeInput">Nome da Ficha *</label>
                <input
                  id="treinoNomeInput"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Treino A - Superior, PUSH, Peito e Tríceps"
                  value={treinoNome}
                  maxLength={120}
                  onChange={(e) => setTreinoNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="treinoObsInput">Observações da Ficha (opcional)</label>
                <input
                  id="treinoObsInput"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Foco em deltoide anterior e peitoral superior"
                  value={treinoObs}
                  maxLength={1000}
                  onChange={(e) => setTreinoObs(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeTreinoModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={16} />
                  <span>Criar Ficha</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EDITAR / RENOMEAR FICHA */}
      {/* ========================================================================= */}
      {showEditFichaModal && (
        <div 
          className="modal-backdrop" 
          onClick={closeEditFichaModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalEditFichaTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    CONFIGURAÇÃO // EDITAR FICHA
                  </span>
                </div>
                <h3 id="modalEditFichaTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Editar Ficha
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeEditFichaModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpdateTreino} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="editFichaNomeInput">Nome da Ficha *</label>
                <input
                  id="editFichaNomeInput"
                  type="text"
                  className="form-input"
                  value={editFichaNome}
                  maxLength={120}
                  onChange={(e) => setEditFichaNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editFichaObsInput">Observações da Ficha</label>
                <input
                  id="editFichaObsInput"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Aquecimento articular prévio obrigatório"
                  value={editFichaObs}
                  maxLength={1000}
                  onChange={(e) => setEditFichaObs(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="editFichaRodapeInput">Rodapé desta ficha (exceção)</label>
                <textarea
                  id="editFichaRodapeInput"
                  className="form-input"
                  rows={4}
                  maxLength={1000}
                  disabled={editFichaSemRodape}
                  placeholder={user?.rodapeTreino ? `Em branco = usa o padrão: ${user.rodapeTreino}` : 'Em branco = usa o rodapé padrão das Configurações'}
                  value={editFichaRodape}
                  onChange={(e) => setEditFichaRodape(e.target.value)}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', marginTop: '0.4rem' }}>
                  <input
                    type="checkbox"
                    checked={editFichaSemRodape}
                    onChange={(e) => setEditFichaSemRodape(e.target.checked)}
                  />
                  Não exibir rodapé nesta ficha
                </label>
              </div>

              <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeEditFichaModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PRESCREVER / EDITAR EXERCÍCIO */}
      {/* ========================================================================= */}
      {showExerciseModal && (
        <div 
          className="modal-backdrop" 
          onClick={closeExerciseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalExercisePrescriptionTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {editingExercisePrescriptionId ? 'PRESCRIÇÃO // EDITAR EXERCÍCIO' : 'PRESCRIÇÃO // NOVO EXERCÍCIO'}
                  </span>
                </div>
                <h3 id="modalExercisePrescriptionTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  {editingExercisePrescriptionId ? 'Editar Prescrição' : `Adicionar Exercício (${activeFicha?.nome || 'Ficha'})`}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeExerciseModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePrescribeExercise} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Grupo Muscular *</label>
                  <select
                    className="form-input"
                    value={selectedGrupo}
                    onChange={(e) => {
                      setSelectedGrupo(Number(e.target.value));
                      setSelectedExercicio(0);
                    }}
                    required
                  >
                    <option value={0}>Selecione...</option>
                    {catalogGrupos.map(g => (
                      <option key={g.idGrupoMuscular} value={g.idGrupoMuscular}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Exercício *</label>
                  <select
                    className="form-input"
                    value={selectedExercicio}
                    onChange={(e) => setSelectedExercicio(Number(e.target.value))}
                    disabled={!selectedGrupo}
                    required
                  >
                    <option value={0}>{!selectedGrupo ? 'Escolha o grupo primeiro' : 'Selecione o exercício...'}</option>
                    {catalogExercicios
                      .filter(ex => ex.idGrupoMuscular === selectedGrupo)
                      .map(ex => (
                        <option key={ex.idExercicio} value={ex.idExercicio}>
                          {ex.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Séries *</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    className="form-input"
                    value={exSeries}
                    onChange={(e) => setExSeries(Number(e.target.value))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Repetições *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={exReps}
                    maxLength={30}
                    onChange={(e) => setExReps(e.target.value)}
                    placeholder="Ex: 8-12 ou 10"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descanso</label>
                  <input
                    type="text"
                    inputMode="text"
                    className="form-input"
                    value={exDescanso}
                    onChange={(e) => setExDescanso(e.target.value)}
                    placeholder="Ex: 60, 60-90 ou 1-3 min"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Técnica Avançada (opcional)</label>
                <select
                  className="form-input"
                  value={selectedTecnica || ''}
                  onChange={(e) => setSelectedTecnica(e.target.value ? Number(e.target.value) : undefined)}
                >
                  <option value="">Nenhuma (execução padrão)</option>
                  {catalogTecnicas.map(t => (
                    <option key={t.idTecnica} value={t.idTecnica}>{t.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Instruções / Anotações de Execução</label>
                <InstrucaoAutocomplete
                  value={exObs}
                  onChange={setExObs}
                  instrucoes={catalogInstrucoes}
                  onSave={handleSaveInstrucao}
                  placeholder="Ex: Buscar a falha (comece a digitar para ver sugestões)"
                  maxLength={1000}
                />
              </div>

              <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeExerciseModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{editingExercisePrescriptionId ? 'Atualizar Prescrição' : 'Adicionar à Ficha'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: CONFIGURAR IMPRESSÃO & GERAR PDF */}
      {/* ========================================================================= */}
      {showPrintModal && (
        <div 
          className="modal-backdrop" 
          onClick={() => setShowPrintModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalPrintTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '520px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span className="section-label" style={{ margin: 0 }}>BACKUP OFFLINE // PDF</span>
                </div>
                <h2 id="modalPrintTitle" style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>
                  Exportar PDF da Prescrição
                </h2>
                <p style={{ color: 'var(--text-1)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                  Gere um PDF leve para o aluno consultar a rotina de treinos na academia caso fique sem internet.
                </p>
              </div>
              <button 
                type="button" 
                className="exercise-action-btn"
                onClick={() => setShowPrintModal(false)}
                aria-label="Fechar"
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Escopo da Impressão */}
              <div>
                <label className="section-label" style={{ marginBottom: '0.5rem' }}>
                  Fichas a Incluir
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.65rem', 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-m)',
                      border: printScope === 'all' ? '1px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: printScope === 'all' ? 'var(--accent-dim)' : 'var(--bg-1)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="printScope" 
                      checked={printScope === 'all'} 
                      onChange={() => setPrintScope('all')} 
                      style={{ marginTop: '3px', accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-0)' }}>
                        Protocolo Completo ({activeProtocol?.treinos.length} {activeProtocol?.treinos.length === 1 ? 'Ficha' : 'Fichas'})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', marginTop: '0.15rem' }}>
                        Inclui todas as divisões do ciclo ({activeProtocol?.treinos.map(t => t.nome).join(', ')}).
                      </div>
                    </div>
                  </label>

                  <label 
                    style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.65rem', 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-m)',
                      border: printScope === 'current' ? '1px solid var(--accent)' : '1px solid var(--border)',
                      backgroundColor: printScope === 'current' ? 'var(--accent-dim)' : 'var(--bg-1)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input 
                      type="radio" 
                      name="printScope" 
                      checked={printScope === 'current'} 
                      onChange={() => setPrintScope('current')} 
                      style={{ marginTop: '3px', accentColor: 'var(--accent)' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-0)' }}>
                        Apenas a Ficha Ativa ({currentFicha?.nome || 'Ficha Selecionada'})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', marginTop: '0.15rem' }}>
                        Gera arquivo avulso apenas da divisão aberta no momento.
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Opções de Conteúdo */}
              <div>
                <label className="section-label" style={{ marginBottom: '0.5rem' }}>
                  Opções de Diagramação
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'var(--bg-1)', padding: '0.75rem', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)' }}>
                  {printScope === 'all' && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-0)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={printPagePerFicha} 
                        onChange={e => setPrintPagePerFicha(e.target.checked)} 
                        style={{ accentColor: 'var(--accent)' }}
                      />
                      <span><strong>Uma página por ficha</strong> (Ideal para visualização rápida no celular)</span>
                    </label>
                  )}
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.82rem', color: 'var(--text-0)', cursor: 'pointer' }}>
                    <input 
                      type="checkbox" 
                      checked={printGuidelines} 
                      onChange={e => setPrintGuidelines(e.target.checked)} 
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span><strong>Rodapé de cada treino</strong> (instruções do treinador, definidas em Configurações)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer" style={{ margin: 0, paddingTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowPrintModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  onClick={handleTriggerPrint}
                >
                  <FileText size={16} />
                  <span>Gerar PDF Offline</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
