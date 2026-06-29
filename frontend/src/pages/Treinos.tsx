import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, Plus, Calendar, 
  Trash2, Printer, AlertCircle,
  ArrowUp, ArrowDown, Edit, Share2
} from 'lucide-react';

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

export const Treinos: React.FC = () => {
  const { idAluno } = useParams<{ idAluno: string }>();
  const { user } = useAuth();
  
  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [activeProtocol, setActiveProtocol] = useState<Protocolo | null>(null);
  const [volume, setVolume] = useState<Record<string, number>>({});
  
  // Catalogs
  const [catalogExercicios, setCatalogExercicios] = useState<Exercicio[]>([]);
  const [catalogTecnicas, setCatalogTecnicas] = useState<TecnicaTreino[]>([]);
  const [catalogGrupos, setCatalogGrupos] = useState<GrupoMuscular[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [creatingProtocol, setCreatingProtocol] = useState(false);
  const [creatingTreino, setCreatingTreino] = useState(false);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);
  const [editingExercisePrescriptionId, setEditingExercisePrescriptionId] = useState<number | null>(null);

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

  const handleShare = () => {
    if (aluno?.tokenAcesso) {
      const url = `${window.location.origin}/v/${aluno.tokenAcesso}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  // Auto-select first tab when activeProtocol changes
  useEffect(() => {
    if (activeProtocol && activeProtocol.treinos.length > 0) {
      const sorted = [...activeProtocol.treinos].sort((a, b) => a.ordem - b.ordem);
      setActiveTabId(sorted[0].idTreino);
    } else {
      setActiveTabId(null);
    }
  }, [activeProtocol]);

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

  const loadStaticData = async () => {
    try {
      setError('');
      const [studentRes, exerciciosRes, tecnicasRes, gruposRes] = await Promise.all([
        api.get(`/alunos/${idAluno}`),
        api.get('/exercicios'),
        api.get('/exercicios/tecnicas'),
        api.get('/exercicios/grupos')
      ]);
      setAluno(studentRes.data);
      setCatalogExercicios(exerciciosRes.data);
      setCatalogTecnicas(tecnicasRes.data);
      setCatalogGrupos(gruposRes.data);
    } catch (err) {
      console.error('Erro ao carregar dados estáticos:', err);
      setError('Erro ao carregar dados da biblioteca.');
    }
  };

  const loadDynamicData = async (showGlobalLoading = false) => {
    try {
      if (showGlobalLoading) setLoading(true);
      else setRefreshing(true);
      setError('');

      const protocolsRes = await api.get(`/treinos/protocolos/${idAluno}`);
      setProtocolos(protocolsRes.data);

      const active = protocolsRes.data.find((p: any) => p.ativo === true);
      if (active) {
        const [detailsRes, volumeRes] = await Promise.all([
          api.get(`/treinos/protocolos/detalhes/${active.idProtocolo}`),
          api.get(`/treinos/volume/${idAluno}`)
        ]);
        setActiveProtocol(detailsRes.data);
        setVolume(volumeRes.data);
      } else {
        setActiveProtocol(null);
        setVolume({});
      }
    } catch (err) {
      console.error('Erro ao carregar periodização:', err);
      setError('Erro ao carregar periodização.');
    } finally {
      if (showGlobalLoading) setLoading(false);
      else setRefreshing(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([loadStaticData(), loadDynamicData(false)]);
      setLoading(false);
    };
    init();
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
      
      // 1. Create muscle groups
      const grupos = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core'];
      const grupoIds: Record<string, number> = {};
      
      for (const g of grupos) {
        const res = await api.post('/exercicios/grupos', { nome: g });
        grupoIds[g] = res.data.idGrupoMuscular;
      }

      // 2. Create exercises
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

      // 3. Create techniques
      const tecnicas = [
        { nome: 'Drop-set', desc: 'Realiza falha, reduz carga 20-30%, falha novamente sem descanso.' },
        { nome: 'Rest-Pause', desc: 'Falha, descansa 15s, realiza mais reps com mesma carga.' },
        { nome: 'Bi-set', desc: 'Realizar dois exercícios seguidos sem descanso.' }
      ];

      for (const t of tecnicas) {
        await api.post('/exercicios/tecnicas', { nome: t.nome, descricao: t.desc });
      }

      // Reload
      await Promise.all([loadStaticData(), loadDynamicData(false)]);
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
    try {
      await api.post(`/treinos/protocolos/${idAluno}`, {
        nome: protoNome,
        objetivo: protoObjetivo || undefined,
        dataInicio: protoInicio || undefined,
        dataFim: protoFim || undefined
      });

      setProtoNome('');
      setProtoObjetivo('');
      setProtoInicio('');
      setProtoFim('');
      setCreatingProtocol(false);
      loadDynamicData(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao criar protocolo de treino.');
    }
  };

  // Ficha operations
  const handleCreateTreino = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProtocol) return;

    try {
      await api.post(`/treinos/fichas/${activeProtocol.idProtocolo}`, {
        nome: treinoNome,
        observacao: treinoObs || undefined,
        ordem: Number(treinoOrdem)
      });

      setTreinoNome('');
      setTreinoObs('');
      setTreinoOrdem(activeProtocol.treinos.length + 2);
      setCreatingTreino(false);
      loadDynamicData(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao criar ficha de treino.');
    }
  };

  // Prescribe Exercise operations
  const handlePrescribeExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTabId) return;

    try {
      if (editingExercisePrescriptionId) {
        // Edit existing prescription
        await api.patch(`/treinos/exercicios/${editingExercisePrescriptionId}`, {
          idExercicio: Number(selectedExercicio),
          idTecnica: selectedTecnica ? Number(selectedTecnica) : null,
          series: Number(exSeries),
          repeticoes: exReps,
          descansoSegundos: Number(exDescanso) || null,
          observacao: exObs || null,
        });
      } else {
        // Create new prescription
        await api.post(`/treinos/exercicios/${activeTabId}`, {
          idExercicio: Number(selectedExercicio),
          idTecnica: selectedTecnica ? Number(selectedTecnica) : undefined,
          series: Number(exSeries),
          repeticoes: exReps,
          descansoSegundos: Number(exDescanso) || undefined,
          observacao: exObs || undefined,
          ordem: activeProtocol?.treinos.find(t => t.idTreino === activeTabId)?.exercicios.length || 1
        });
      }

      cancelEdit();
      loadDynamicData(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao salvar/editar prescrição.');
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
    // Smooth scroll to the form
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  };

  const handleMoveExercise = async (treino: FichaTreino, index: number, direction: 'up' | 'down') => {
    setError('');
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= treino.exercicios.length) return;

    const currentEx = treino.exercicios[index];
    const targetEx = treino.exercicios[targetIndex];

    try {
      await Promise.all([
        api.patch(`/treinos/exercicios/${currentEx.idTreinoExercicio}`, { ordem: targetEx.ordem }),
        api.patch(`/treinos/exercicios/${targetEx.idTreinoExercicio}`, { ordem: currentEx.ordem })
      ]);
      
      loadDynamicData(false);
    } catch (err) {
      console.error('Erro ao reordenar exercício:', err);
      setError('Erro ao reordenar exercício.');
    }
  };

  const handleRemoveExercise = async (idTreinoExercicio: number) => {
    if (!confirm('Deseja excluir esta prescrição?')) return;
    try {
      await api.delete(`/treinos/exercicios/${idTreinoExercicio}`);
      loadDynamicData(false);
    } catch (err) {
      console.error(err);
      setError('Erro ao remover exercício.');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Carregando ficha e periodização do aluno...</div>;
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
              {activeProtocol?.objetivo && ` · ${activeProtocol.objetivo}`}
              {refreshing && ' · Atualizando...'}
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
          <button className="btn btn-ghost btn-sm" onClick={() => setCreatingProtocol(!creatingProtocol)}>
            <Calendar size={14} />
            {creatingProtocol ? 'Cancelar' : 'Periodizações'}
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="badge" style={{ display: 'block', padding: '0.75rem', textAlign: 'center', backgroundColor: 'rgba(255,80,80,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)' }}>
          {error}
        </div>
      )}

      {/* Protocol Management (collapsible) */}
      {creatingProtocol && (
        <div className="card animate-in">
          <form onSubmit={handleCreateProtocolo} style={{ marginBottom: '1.25rem' }}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Nome do Protocolo</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Ex: Hipertrofia 12 sem."
                  value={protoNome}
                  onChange={(e) => setProtoNome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Objetivo</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Ex: Ganho de massa magra"
                  value={protoObjetivo}
                  onChange={(e) => setProtoObjetivo(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Início</label>
                <input
                  type="date"
                  className="form-input form-input-sm"
                  value={protoInicio}
                  onChange={(e) => setProtoInicio(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Fim</label>
                <input
                  type="date"
                  className="form-input form-input-sm"
                  value={protoFim}
                  onChange={(e) => setProtoFim(e.target.value)}
                />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-sm">Criar</button>
              </div>
            </div>
          </form>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {protocolos.length > 0 ? (
              protocolos.map((proto) => (
                <button
                  key={proto.idProtocolo}
                  type="button"
                  className="btn btn-ghost btn-sm"
                  style={{
                    border: proto.ativo ? '1px solid var(--accent)' : '1px solid var(--card-border)',
                    backgroundColor: proto.ativo ? 'rgba(204, 255, 0, 0.05)' : undefined,
                  }}
                  onClick={async () => {
                    const res = await api.get(`/treinos/protocolos/detalhes/${proto.idProtocolo}`);
                    setActiveProtocol(res.data);
                  }}
                >
                  {proto.nome}
                  {proto.ativo && <span className="badge badge-success" style={{ marginLeft: '0.4rem' }}>Ativo</span>}
                </button>
              ))
            ) : (
              <span style={{ color: 'var(--text-2)', fontSize: '0.85rem' }}>Nenhum protocolo cadastrado.</span>
            )}
          </div>
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
                  cancelEdit();
                }}
              >
                {treino.nome}
              </button>
            ))}
            <button
              className="ficha-tab ficha-tab-add"
              onClick={() => {
                setCreatingTreino(!creatingTreino);
                setTreinoOrdem(activeProtocol.treinos.length + 1);
              }}
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Create Ficha Form */}
          {creatingTreino && (
            <div className="card animate-in">
              <form onSubmit={handleCreateTreino}>
                <div className="form-row">
                  <div className="form-group" style={{ flex: 2 }}>
                    <label className="form-label">Nome da Ficha</label>
                    <input
                      type="text"
                      className="form-input form-input-sm"
                      placeholder="Ex: Treino A - Superior"
                      value={treinoNome}
                      onChange={(e) => setTreinoNome(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button type="submit" className="btn btn-primary btn-sm">Criar</button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Active Ficha Content */}
          {activeFicha ? (
            <>
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
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-2)' }}>
                    Nenhum exercício prescrito
                  </div>
                )}
              </div>

              {/* Add Exercise Bar */}
              {editingExercisePrescriptionId && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Editando exercício
                </span>
              )}
              <form className="add-exercise-bar" onSubmit={handlePrescribeExercise}>
                <div className="form-group">
                  <label className="form-label">Grupo</label>
                  <select
                    className="form-input form-input-sm"
                    value={selectedGrupo}
                    onChange={(e) => {
                      setSelectedGrupo(Number(e.target.value));
                      setSelectedExercicio(0);
                    }}
                    required
                  >
                    <option value={0}>Grupo...</option>
                    {catalogGrupos.map(g => (
                      <option key={g.idGrupoMuscular} value={g.idGrupoMuscular}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Exercício</label>
                  <select
                    className="form-input form-input-sm"
                    value={selectedExercicio}
                    onChange={(e) => setSelectedExercicio(Number(e.target.value))}
                    disabled={!selectedGrupo}
                    required
                  >
                    <option value={0}>{!selectedGrupo ? '—' : 'Selecione...'}</option>
                    {catalogExercicios
                      .filter(ex => ex.idGrupoMuscular === selectedGrupo)
                      .map(ex => (
                        <option key={ex.idExercicio} value={ex.idExercicio}>
                          {ex.nome}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Séries</label>
                  <input
                    type="number"
                    className="form-input form-input-sm"
                    value={exSeries}
                    onChange={(e) => setExSeries(Number(e.target.value))}
                    style={{ width: '60px' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Reps</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={exReps}
                    onChange={(e) => setExReps(e.target.value)}
                    placeholder="10"
                    style={{ width: '70px' }}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Desc.</label>
                  <input
                    type="number"
                    className="form-input form-input-sm"
                    value={exDescanso}
                    onChange={(e) => setExDescanso(Number(e.target.value))}
                    placeholder="60"
                    style={{ width: '60px' }}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Técnica</label>
                  <select
                    className="form-input form-input-sm"
                    value={selectedTecnica || ''}
                    onChange={(e) => setSelectedTecnica(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <option value="">—</option>
                    {catalogTecnicas.map(t => (
                      <option key={t.idTecnica} value={t.idTecnica}>{t.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    value={exObs}
                    placeholder="Instruções (opcional)"
                    onChange={(e) => setExObs(e.target.value)}
                    style={{ width: '140px' }}
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm">
                  {editingExercisePrescriptionId ? 'Salvar' : 'Adicionar'}
                </button>
                {editingExercisePrescriptionId && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={cancelEdit}>✕</button>
                )}
              </form>

              {/* Volume Footer */}
              {Object.keys(volume).length > 0 && (
                <div className="volume-footer" style={{ alignItems: 'center' }}>
                  <span style={{ color: 'var(--text-1)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginRight: '0.25rem' }}>
                    Volume Semanal:
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
      {!activeProtocol && !creatingProtocol && (
        <div className="card" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-2)' }}>
          Nenhum protocolo ativo. Clique em "Periodizações" para criar ou selecionar um.
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
    </div>
  );
};
