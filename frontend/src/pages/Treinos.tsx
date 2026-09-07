import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Plus, Calendar, 
  Trash2, Printer, AlertCircle,
  ArrowUp, ArrowDown, Edit, Edit2, Share2, X, Save
} from 'lucide-react';
import { memoryCache } from '../services/cache';

interface GrupoMuscular {
  idGrupoMuscular: number;
  nome: string;
}

interface Exercicio {
  idExercicio: number;
  nome: string;
  idGrupoMuscular: number;
  grupoMuscular: GrupoMuscular;
}

interface TecnicaTreino {
  idTecnica: number;
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
  ordem: number;
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
  dataInicio?: string;
  dataFim?: string;
  ativo: boolean;
  treinos: FichaTreino[];
}

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

export const Treinos: React.FC = () => {
  const { idAluno } = useParams<{ idAluno: string }>();
  const { user } = useAuth();
  
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [activeProtocol, setActiveProtocol] = useState<Protocolo | null>(null);
  const [volume, setVolume] = useState<Record<string, number>>({});
  
  // Catalogs
  const [catalogExercicios, setCatalogExercicios] = useState<Exercicio[]>(cachedCatalogs?.exercicios || []);
  const [catalogTecnicas, setCatalogTecnicas] = useState<TecnicaTreino[]>(cachedCatalogs?.tecnicas || []);
  const [catalogGrupos, setCatalogGrupos] = useState<GrupoMuscular[]>(cachedCatalogs?.grupos || []);

  // UI state
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // --- MODAL STATES ---
  const [showProtocolModal, setShowProtocolModal] = useState(false);
  const [showTreinoModal, setShowTreinoModal] = useState(false);
  const [showEditFichaModal, setShowEditFichaModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);

  // Edit Ficha state
  const [editingFichaId, setEditingFichaId] = useState<number | null>(null);
  const [editFichaNome, setEditFichaNome] = useState('');
  const [editFichaObs, setEditFichaObs] = useState('');

  // New Protocol inputs
  const [protoNome, setProtoNome] = useState('');
  const [protoObjetivo, setProtoObjetivo] = useState('');
  const [protoInicio, setProtoInicio] = useState('');
  const [protoFim, setProtoFim] = useState('');

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
  const [exDescanso, setExDescanso] = useState(60);
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
    setExDescanso(60);
    setExObs('');
  };

  // Modal helpers
  const closeProtocolModal = () => setShowProtocolModal(false);
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

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowProtocolModal(false);
        setShowTreinoModal(false);
        setShowEditFichaModal(false);
        setShowExerciseModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleShare = () => {
    if (aluno?.tokenAcesso) {
      const url = `${window.location.origin}/v/${aluno.tokenAcesso}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      toast.success('Link do treino copiado!');
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

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

  // Carregamento consolidado rápido em 1 requisição (com fallback resiliente)
  const loadOverview = async (showGlobalLoading = false) => {
    try {
      if (showGlobalLoading) setLoading(true);
      else setRefreshing(true);
      setError('');

      try {
        const [overviewRes] = await Promise.all([
          api.get(`/treinos/visao-geral/${idAluno}`),
          loadCatalogs(),
        ]);

        const { aluno: stAluno, protocolos: stProtocolos, activeProtocol: stActive, volume: stVolume } = overviewRes.data;
        setAluno(stAluno);
        setProtocolos(stProtocolos);
        setActiveProtocol(stActive);
        setVolume(stVolume || {});
        if (idAluno) {
          memoryCache.set(`visao-geral-${idAluno}`, overviewRes.data);
        }
      } catch (fastErr) {
        console.warn('Fallback para carregamento tradicional enquanto deploy finaliza:', fastErr);
        const [studentRes, protocolsRes] = await Promise.all([
          api.get(`/alunos/${idAluno}`),
          api.get(`/treinos/protocolos/${idAluno}`),
          loadCatalogs(),
        ]);
        setAluno(studentRes.data);
        setProtocolos(protocolsRes.data);

        const active = protocolsRes.data.find((p: any) => p.ativo === true);
        if (active) {
          const [detailsRes, volumeRes] = await Promise.all([
            api.get(`/treinos/protocolos/detalhes/${active.idProtocolo}`),
            api.get(`/treinos/volume/${idAluno}`)
          ]);
          setActiveProtocol(detailsRes.data);
          setVolume(volumeRes.data);
          if (idAluno) {
            memoryCache.set(`visao-geral-${idAluno}`, {
              aluno: studentRes.data,
              protocolos: protocolsRes.data,
              activeProtocol: detailsRes.data,
              volume: volumeRes.data,
            });
          }
        } else {
          setActiveProtocol(null);
          setVolume({});
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados do aluno:', err);
      setError('Erro ao carregar dados do aluno.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cached = idAluno ? memoryCache.get<any>(`visao-geral-${idAluno}`) : null;
    if (cached) {
      setAluno(cached.aluno);
      setProtocolos(cached.protocolos);
      setActiveProtocol(cached.activeProtocol);
      setVolume(cached.volume || {});
      setLoading(false);
      // Revalida em segundo plano sem travar o usuário
      loadOverview(false);
    } else {
      setLoading(true);
      loadOverview(true);
    }
  }, [idAluno]);

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
        { nome: 'Supino Reto', grupo: 'Peito' },
        { nome: 'Supino Inclinado c/ Halteres', grupo: 'Peito' },
        { nome: 'Crossover Polia Alta', grupo: 'Peito' },
        { nome: 'Puxada Aberta na Frente', grupo: 'Costas' },
        { nome: 'Remada Curvada', grupo: 'Costas' },
        { nome: 'Agachamento Livre', grupo: 'Pernas' },
        { nome: 'Leg Press 45', grupo: 'Pernas' },
        { nome: 'Cadeira Extensora', grupo: 'Pernas' },
        { nome: 'Desenvolvimento c/ Halteres', grupo: 'Ombros' },
        { nome: 'Elevação Lateral', grupo: 'Ombros' },
        { nome: 'Rosca Direta Polia', grupo: 'Braços' },
        { nome: 'Tríceps Corda', grupo: 'Braços' },
        { nome: 'Abdominal Supra', grupo: 'Core' },
        { nome: 'Prancha Isométrica', grupo: 'Core' },
      ];

      for (const ex of exercicios) {
        await api.post('/exercicios', {
          nome: ex.nome,
          idGrupoMuscular: grupoIds[ex.grupo]
        });
      }

      const tecnicas = [
        { nome: 'Drop-set', desc: 'Realiza falha, reduz carga 20-30%, falha novamente sem descanso.' },
        { nome: 'Rest-Pause', desc: 'Falha, descansa 15s, realiza mais reps com mesma carga.' },
        { nome: 'Bi-set', desc: 'Realizar dois exercícios seguidos sem descanso.' }
      ];

      for (const t of tecnicas) {
        await api.post('/exercicios/tecnicas', { nome: t.nome, descricao: t.desc });
      }

      cachedCatalogs = null; // Invalida cache
      await loadOverview(true);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao gerar catálogo padrão. Talvez alguns nomes já existam.');
    } finally {
      setLoading(false);
    }
  };

  // Protocols operations
  const handleCreateProtocolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protoNome.trim()) {
      toast.error('Informe o nome do protocolo.');
      return;
    }

    try {
      await api.post(`/treinos/protocolos/${idAluno}`, {
        nome: protoNome.trim(),
        objetivo: protoObjetivo.trim() || undefined,
        dataInicio: protoInicio || undefined,
        dataFim: protoFim || undefined
      });

      setProtoNome('');
      setProtoObjetivo('');
      setProtoInicio('');
      setProtoFim('');
      toast.success('Protocolo criado com sucesso!');
      loadOverview(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar protocolo de treino.');
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

    // Optimistic UI
    setActiveProtocol(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        treinos: prev.treinos.map(t =>
          t.idTreino === targetId ? { ...t, nome: newNome, observacao: newObs || undefined } : t
        ),
      };
    });

    closeEditFichaModal();
    toast.success('Ficha atualizada com sucesso!');

    try {
      await api.patch(`/treinos/fichas/${targetId}`, {
        nome: newNome,
        observacao: newObs || null,
      });
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar alterações da ficha.');
      loadOverview(false);
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
      loadOverview(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir ficha no servidor.');
      loadOverview(false);
    }
  };

  // Protocol delete
  const handleDeleteProtocolo = async (idProtocolo: number, nome: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Deseja excluir o protocolo "${nome}" e todas as suas fichas?`)) return;

    // Optimistic UI
    setProtocolos(prev => prev.filter(p => p.idProtocolo !== idProtocolo));
    if (activeProtocol?.idProtocolo === idProtocolo) {
      setActiveProtocol(null);
      setActiveTabId(null);
    }

    toast.success('Protocolo excluído.');

    try {
      await api.delete(`/treinos/protocolos/${idProtocolo}`);
      loadOverview(false);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir protocolo no servidor.');
      loadOverview(false);
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

    const currentFicha = activeProtocol.treinos.find(t => t.idTreino === activeTabId);

    if (editingExercisePrescriptionId) {
      // --- EDIÇÃO OTIMISTA INSTANTÂNEA ---
      const editId = editingExercisePrescriptionId;
      const oldItem = currentFicha?.exercicios.find(x => x.idTreinoExercicio === editId);
      const oldSeries = oldItem?.series || 0;
      const oldGroup = oldItem?.exercicio.grupoMuscular.nome;

      const updatedItem: PrescribedExercise = {
        idTreinoExercicio: editId,
        series: Number(exSeries),
        repeticoes: String(exReps),
        descansoSegundos: Number(exDescanso) || 60,
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

      // Atualiza volume imediatamente (0ms)
      setVolume(prev => {
        const next = { ...prev };
        if (oldGroup) next[oldGroup] = Math.max(0, (next[oldGroup] || 0) - oldSeries);
        next[exObj.grupoMuscular.nome] = (next[exObj.grupoMuscular.nome] || 0) + Number(exSeries);
        return next;
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
          descansoSegundos: Number(exDescanso) || null,
          observacao: exObs || null,
        });
      } catch (err) {
        console.error('Erro ao salvar edição:', err);
        toast.error('Erro ao salvar no servidor.');
        loadOverview(false);
      }
    } else {
      // --- ADIÇÃO OTIMISTA INSTANTÂNEA ---
      const tempId = -Date.now();
      const newOrder = (currentFicha?.exercicios.length || 0) + 1;
      const newItem: PrescribedExercise = {
        idTreinoExercicio: tempId,
        series: Number(exSeries),
        repeticoes: String(exReps),
        descansoSegundos: Number(exDescanso) || 60,
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

      // Atualiza volume imediatamente (0ms)
      setVolume(prev => ({
        ...prev,
        [exObj.grupoMuscular.nome]: (prev[exObj.grupoMuscular.nome] || 0) + Number(exSeries),
      }));

      closeExerciseModal();
      toast.success('Exercício adicionado!');

      // Salva no backend em background e sincroniza o ID real
      try {
        const res = await api.post(`/treinos/exercicios/${activeTabId}`, {
          idExercicio: Number(selectedExercicio),
          idTecnica: selectedTecnica ? Number(selectedTecnica) : undefined,
          series: Number(exSeries),
          repeticoes: exReps,
          descansoSegundos: Number(exDescanso) || undefined,
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
        loadOverview(false);
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
    setExDescanso(item.descansoSegundos || 60);
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
      loadOverview(false);
    }
  };

  // Remoção otimista instantânea
  const handleRemoveExercise = async (idTreinoExercicio: number) => {
    if (!confirm('Deseja excluir esta prescrição?')) return;
    if (!activeProtocol || !activeTabId) return;

    const currentFicha = activeProtocol.treinos.find(t => t.idTreino === activeTabId);
    const removed = currentFicha?.exercicios.find(x => x.idTreinoExercicio === idTreinoExercicio);

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

    if (removed) {
      setVolume(prev => {
        const group = removed.exercicio.grupoMuscular.nome;
        return {
          ...prev,
          [group]: Math.max(0, (prev[group] || 0) - removed.series),
        };
      });
    }

    try {
      await api.delete(`/treinos/exercicios/${idTreinoExercicio}`);
    } catch (err) {
      console.error('Erro ao remover no servidor:', err);
      loadOverview(false);
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

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Section */}
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link to="/" className="btn btn-ghost btn-icon">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1>{aluno?.nome}</h1>
            <p>
              {activeProtocol?.nome || 'Sem protocolo ativo'}
              {activeProtocol?.objetivo && (
                <span style={{ color: 'var(--text-2)', margin: '0 0.35rem' }}>|</span>
              )}{activeProtocol?.objetivo}
              {refreshing && <span style={{ color: 'var(--text-2)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>Atualizando...</span>}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {aluno?.tokenAcesso && (
            <button className="btn btn-secondary btn-sm" onClick={handleShare}>
              <Share2 size={14} />
              {shareCopied ? 'Copiado!' : 'Compartilhar'}
            </button>
          )}
          {activeProtocol && (
            <button className="btn btn-secondary btn-sm" onClick={() => window.print()}>
              <Printer size={14} />
              Imprimir
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowProtocolModal(true)}>
            <Calendar size={14} />
            Periodizações
          </button>
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

      {/* Ficha Tabs */}
      {activeProtocol && (
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
              {/* Active Ficha Toolbar (Renomear / Excluir Ficha) */}
              <div className="flex-between" style={{ alignItems: 'center', marginBottom: '0.75rem', padding: '0.25rem 0' }}>
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
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => {
                      setEditingFichaId(activeFicha.idTreino);
                      setEditFichaNome(activeFicha.nome);
                      setEditFichaObs(activeFicha.observacao || '');
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
              <div className="exercise-stack">
                {sortedExercicios.length > 0 ? (
                  sortedExercicios.map((item, idx) => (
                    <div key={item.idTreinoExercicio} className="exercise-block">
                      <div className="exercise-block-handle">
                        <button
                          className="exercise-action-btn"
                          disabled={idx === 0}
                          onClick={() => handleMoveExercise(activeFicha, idx, 'up')}
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          className="exercise-action-btn"
                          disabled={idx === sortedExercicios.length - 1}
                          onClick={() => handleMoveExercise(activeFicha, idx, 'down')}
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>
                      <div className="exercise-block-info">
                        <div className="exercise-block-name">{item.exercicio.nome}</div>
                        <div className="exercise-block-detail">
                          <span className="exercise-block-tag">{item.exercicio.grupoMuscular.nome}</span>
                          {item.tecnica && <span className="exercise-block-tag">{item.tecnica.nome}</span>}
                          {item.observacao && <span>{item.observacao}</span>}
                        </div>
                      </div>
                      <div className="exercise-block-stats">
                        <span className="exercise-block-stat">
                          {item.series}<span className="exercise-block-stat-label">×</span>{item.repeticoes}
                        </span>
                        {item.descansoSegundos && (
                          <span className="exercise-block-stat">
                            {item.descansoSegundos}<span className="exercise-block-stat-label">s</span>
                          </span>
                        )}
                      </div>
                      <div className="exercise-block-actions">
                        <button
                          className="exercise-action-btn accent"
                          onClick={() => handleEditPrescription(item, activeFicha.idTreino)}
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          className="exercise-action-btn danger"
                          onClick={() => handleRemoveExercise(item.idTreinoExercicio)}
                          title="Remover"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                    <p style={{ margin: 0 }}>Nenhum exercício prescrito nesta ficha ainda.</p>
                    <button type="button" className="btn btn-primary btn-sm" onClick={openNewExerciseModal}>
                      <Plus size={14} />
                      Prescrever Primeiro Exercício
                    </button>
                  </div>
                )}
              </div>

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
              {Object.keys(volume).length > 0 && (
                <div className="volume-footer" style={{ alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-1)', fontSize: '0.8rem', fontWeight: 600, marginRight: '0.25rem' }}>
                    Volume semanal:
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {Object.entries(volume).map(([grupo, series]) => (
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

      {/* No active protocol state */}
      {!activeProtocol && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-1)' }}>
            Nenhum protocolo ativo para este aluno.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowProtocolModal(true)}>
            <Calendar size={16} />
            Gerenciar Periodizações / Novo Ciclo
          </button>
        </div>
      )}

      {/* --- PRINT VIEW FOR WINDOW.PRINT() --- */}
      {activeProtocol && aluno && (
        <div id="print-section" className="print-only">
          <div className="print-header">
            {/* Branding Logo */}
            {user?.logoUrl && (
              <img src={user.logoUrl} alt="Logo" className="print-logo" />
            )}
            
            <div className="print-trainer-info">
              <h1 className="print-trainer-name">{user?.nome || 'Personal Trainer'}</h1>
              <p>{user?.profissao || 'Profissional de Educação Física'} | CREF: {user?.cref}</p>
              {user?.telefone && <span>WhatsApp: {user.telefone} </span>}
              {user?.instagram && <span>Instagram: {user.instagram}</span>}
            </div>
          </div>

          <div className="print-student-meta">
            <div>
              <strong>Aluno:</strong> {aluno.nome}
            </div>
            <div>
              <strong>Programa:</strong> {activeProtocol.nome}
            </div>
            {activeProtocol.objetivo && (
              <div>
                <strong>Objetivo:</strong> {activeProtocol.objetivo}
              </div>
            )}
            <div>
              <strong>Gerado em:</strong> {new Date().toLocaleDateString()}
            </div>
          </div>

          {activeProtocol.treinos.map((treino) => (
            <div key={treino.idTreino} className="print-treino-block" style={{ pageBreakInside: 'avoid' }}>
              <h2 className="print-treino-title">{treino.nome}</h2>
              {treino.observacao && (
                <p className="print-treino-obs"><em>Obs: {treino.observacao}</em></p>
              )}
              
              <table className="print-table">
                <thead>
                  <tr>
                    <th>Exercício</th>
                    <th>Músculo</th>
                    <th>Séries</th>
                    <th>Repetições</th>
                    <th>Descanso</th>
                    <th>Técnica / Anotações</th>
                  </tr>
                </thead>
                <tbody>
                  {treino.exercicios && treino.exercicios.length > 0 ? (
                    treino.exercicios.map((item) => (
                      <tr key={item.idTreinoExercicio}>
                        <td style={{ fontWeight: 'bold' }}>{item.exercicio.nome}</td>
                        <td>{item.exercicio.grupoMuscular.nome}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.series}</td>
                        <td>{item.repeticoes}</td>
                        <td>{item.descansoSegundos ? `${item.descansoSegundos}s` : '-'}</td>
                        <td>
                          {item.tecnica && <strong>[{item.tecnica.nome}] </strong>}
                          {item.observacao || ''}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center' }}>Nenhum exercício prescrito.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Print-specific styles */}
      <style>{`
        .print-only {
          display: none;
        }
        
        @media print {
          /* Hide all UI */
          body * {
            visibility: hidden;
          }
          
          /* Show only print container */
          #print-section, #print-section * {
            visibility: visible;
          }
          
          #print-section {
            display: block !important;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            color: #000;
            background-color: #fff;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          }
          
          .print-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #000;
            padding-bottom: 1rem;
            margin-bottom: 1.5rem;
          }
          
          .print-logo {
            max-height: 80px;
            max-width: 150px;
            object-fit: contain;
          }
          
          .print-trainer-info {
            text-align: right;
          }
          
          .print-trainer-name {
            font-size: 1.5rem;
            font-weight: bold;
            margin: 0;
            color: #000 !important;
            background: none !important;
            -webkit-text-fill-color: initial !important;
          }
          
          .print-trainer-info p {
            margin: 0.25rem 0 0;
            font-size: 0.9rem;
            color: #444 !important;
          }
          
          .print-trainer-info span {
            font-size: 0.8rem;
            color: #666;
            margin-left: 1rem;
          }
          
          .print-student-meta {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.5rem;
            margin-bottom: 2rem;
            background-color: #f8f9fa;
            padding: 0.75rem;
            border-radius: 6px;
            border: 1px solid #ddd;
            font-size: 0.9rem;
          }
          
          .print-treino-block {
            margin-bottom: 2.5rem;
          }
          
          .print-treino-title {
            font-size: 1.25rem;
            border-bottom: 1px solid #000;
            padding-bottom: 0.25rem;
            margin-bottom: 0.5rem;
            color: #000 !important;
          }
          
          .print-treino-obs {
            font-size: 0.85rem;
            color: #555;
            margin-bottom: 0.75rem;
          }
          
          .print-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 0.5rem;
            font-size: 0.9rem;
          }
          
          .print-table th, .print-table td {
            border: 1px solid #ddd;
            padding: 6px 10px;
            text-align: left;
          }
          
          .print-table th {
            background-color: #f2f2f2 !important;
            color: #000 !important;
            font-weight: bold;
          }
          
          .print-table tr:nth-child(even) {
            background-color: #fafafa;
          }
        }
      `}</style>

      {/* ========================================================================= */}
      {/* MODAL 1: PERIODIZAÇÕES & PROTOCOLOS */}
      {/* ========================================================================= */}
      {showProtocolModal && (
        <div 
          className="modal-backdrop" 
          onClick={closeProtocolModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalProtocolTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '560px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    PLANEJAMENTO // PERIODIZAÇÕES & PROTOCOLOS
                  </span>
                </div>
                <h3 id="modalProtocolTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Periodizações de {aluno?.nome}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeProtocolModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Lista de Protocolos Existentes */}
              <div>
                <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block', fontWeight: 600 }}>
                  Ciclos Cadastrados
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
                  {protocolos.length > 0 ? (
                    protocolos.map((proto) => {
                      const isActive = activeProtocol?.idProtocolo === proto.idProtocolo;
                      return (
                        <div
                          key={proto.idProtocolo}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-m)',
                            border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)',
                            backgroundColor: isActive ? 'var(--accent-dim)' : 'var(--bg-1)',
                            gap: '0.75rem'
                          }}
                        >
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-0)' }}>
                                {proto.nome}
                              </span>
                              {proto.ativo && (
                                <span className="badge badge-success" style={{ fontSize: '0.65rem' }}>
                                  Ativo
                                </span>
                              )}
                              {isActive && !proto.ativo && (
                                <span className="badge badge-accent" style={{ fontSize: '0.65rem' }}>
                                  Em visualização
                                </span>
                              )}
                            </div>
                            {(proto.objetivo || proto.dataInicio) && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-1)', marginTop: '0.15rem' }}>
                                {proto.objetivo}
                                {proto.dataInicio && ` • ${proto.dataInicio}`}
                                {proto.dataFim && ` até ${proto.dataFim}`}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {!isActive && (
                              <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', minHeight: 'unset' }}
                                onClick={async () => {
                                  const res = await api.get(`/treinos/protocolos/detalhes/${proto.idProtocolo}`);
                                  setActiveProtocol(res.data);
                                  toast.success(`Protocolo "${proto.nome}" selecionado.`);
                                  closeProtocolModal();
                                }}
                              >
                                Visualizar
                              </button>
                            )}
                            <button
                              type="button"
                              className="exercise-action-btn danger"
                              style={{ width: '26px', height: '26px' }}
                              onClick={(e) => handleDeleteProtocolo(proto.idProtocolo, proto.nome, e)}
                              title="Excluir protocolo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Nenhum protocolo cadastrado ainda.</span>
                  )}
                </div>
              </div>

              {/* Formulário Novo Protocolo */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block', fontWeight: 600 }}>
                  Criar Novo Ciclo / Protocolo
                </label>
                <form onSubmit={handleCreateProtocolo} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Nome do Protocolo *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Hipertrofia 12 sem."
                        value={protoNome}
                        onChange={(e) => setProtoNome(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Objetivo</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ex: Ganho de massa magra"
                        value={protoObjetivo}
                        onChange={(e) => setProtoObjetivo(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Data Início</label>
                      <input
                        type="date"
                        className="form-input"
                        value={protoInicio}
                        onChange={(e) => setProtoInicio(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Data Fim</label>
                      <input
                        type="date"
                        className="form-input"
                        value={protoFim}
                        onChange={(e) => setProtoFim(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary btn-sm">
                      <Plus size={14} />
                      <span>Criar Protocolo</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
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
                  onChange={(e) => setEditFichaObs(e.target.value)}
                />
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
                    onChange={(e) => setExReps(e.target.value)}
                    placeholder="Ex: 8-12 ou 10"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Descanso (s)</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    className="form-input"
                    value={exDescanso}
                    onChange={(e) => setExDescanso(Number(e.target.value))}
                    placeholder="60"
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
                <input
                  type="text"
                  className="form-input"
                  value={exObs}
                  placeholder="Ex: Cadência 3010, foco no pico de contração"
                  onChange={(e) => setExObs(e.target.value)}
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

    </div>
  );
};
