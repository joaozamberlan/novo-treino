import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
  Plus, Dumbbell, Sparkles, Edit, Trash2, 
  Video, Save, FolderPlus 
} from 'lucide-react';

interface GrupoMuscular {
  idGrupoMuscular: number;
  nome: string;
}

interface Exercicio {
  idExercicio: number;
  nome: string;
  descricao?: string;
  videoUrl?: string;
  idGrupoMuscular: number;
  grupoMuscular: GrupoMuscular;
}

interface TecnicaTreino {
  idTecnica: number;
  nome: string;
  descricao?: string;
}

export const Catalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exercicios' | 'tecnicas' | 'grupos'>('exercicios');
  const [exercicios, setExercicios] = useState<Exercicio[]>([]);
  const [tecnicas, setTecnicas] = useState<TecnicaTreino[]>([]);
  const [grupos, setGrupos] = useState<GrupoMuscular[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGrupoFilter, setSelectedGrupoFilter] = useState<number>(0);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // --- FORM STATES ---
  // Exercise form
  const [showExForm, setShowExForm] = useState(false);
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [exNome, setExNome] = useState('');
  const [exGrupoId, setExGrupoId] = useState<number>(0);
  const [exDesc, setExDesc] = useState('');
  const [exVideo, setExVideo] = useState('');

  // Muscle group quick add form
  const [showGrupoForm, setShowGrupoForm] = useState(false);
  const [newGrupoNome, setNewGrupoNome] = useState('');

  // Technique form
  const [showTecForm, setShowTecForm] = useState(false);
  const [editingTecId, setEditingTecId] = useState<number | null>(null);
  const [tecNome, setTecNome] = useState('');
  const [tecDesc, setTecDesc] = useState('');

  // Muscle group tab form
  const [showGrupoTabForm, setShowGrupoTabForm] = useState(false);
  const [editingGrupoId, setEditingGrupoId] = useState<number | null>(null);
  const [grupoTabNome, setGrupoTabNome] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const exRes = await api.get('/exercicios');
      setExercicios(exRes.data);

      const tecRes = await api.get('/exercicios/tecnicas');
      setTecnicas(tecRes.data);

      const grpRes = await api.get('/exercicios/grupos');
      setGrupos(grpRes.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar dados do catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Biblioteca | TreinosApp';
    loadData();
  }, []);

  const clearMessages = () => {
    setError('');
    setSuccessMsg('');
  };

  // --- EXERCISE CRUD ---
  const handleSaveExercicio = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!exGrupoId) {
      setError('Por favor, selecione um grupo muscular.');
      return;
    }

    try {
      if (editingExId) {
        // Update
        await api.patch(`/exercicios/${editingExId}`, {
          nome: exNome,
          idGrupoMuscular: Number(exGrupoId),
          descricao: exDesc || null,
          videoUrl: exVideo || null,
        });
        setSuccessMsg('Exercício atualizado com sucesso!');
      } else {
        // Create
        await api.post('/exercicios', {
          nome: exNome,
          idGrupoMuscular: Number(exGrupoId),
          descricao: exDesc || null,
          videoUrl: exVideo || null,
        });
        setSuccessMsg('Exercício criado com sucesso!');
      }

      // Reset form
      setExNome('');
      setExGrupoId(0);
      setExDesc('');
      setExVideo('');
      setEditingExId(null);
      setShowExForm(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao salvar exercício.');
    }
  };

  const handleEditExercicio = (ex: Exercicio) => {
    setEditingExId(ex.idExercicio);
    setExNome(ex.nome);
    setExGrupoId(ex.idGrupoMuscular);
    setExDesc(ex.descricao || '');
    setExVideo(ex.videoUrl || '');
    setShowExForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteExercicio = async (id: number) => {
    if (!confirm('Deseja realmente remover este exercício da biblioteca?')) return;
    clearMessages();

    try {
      await api.delete(`/exercicios/${id}`);
      setSuccessMsg('Exercício removido.');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir exercício.');
    }
  };

  // --- MUSCLE GROUP QUICK ADD ---
  const handleAddGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!newGrupoNome.trim()) return;

    try {
      const res = await api.post('/exercicios/grupos', { nome: newGrupoNome });
      setGrupos([...grupos, res.data]);
      setExGrupoId(res.data.idGrupoMuscular);
      setNewGrupoNome('');
      setShowGrupoForm(false);
      setSuccessMsg('Grupo muscular cadastrado!');
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao cadastrar grupo muscular.');
    }
  };

  // --- TECHNIQUE CRUD ---
  const handleSaveTecnica = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    try {
      if (editingTecId) {
        // Update
        await api.patch(`/exercicios/tecnicas/${editingTecId}`, {
          nome: tecNome,
          descricao: tecDesc || null,
        });
        setSuccessMsg('Técnica de treino atualizada!');
      } else {
        // Create
        await api.post('/exercicios/tecnicas', {
          nome: tecNome,
          descricao: tecDesc || null,
        });
        setSuccessMsg('Técnica de treino cadastrada!');
      }

      setTecNome('');
      setTecDesc('');
      setEditingTecId(null);
      setShowTecForm(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao salvar técnica.');
    }
  };

  const handleEditTecnica = (tec: TecnicaTreino) => {
    setEditingTecId(tec.idTecnica);
    setTecNome(tec.nome);
    setTecDesc(tec.descricao || '');
    setShowTecForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteTecnica = async (id: number) => {
    if (!confirm('Deseja realmente remover esta técnica de treino?')) return;
    clearMessages();

    try {
      await api.delete(`/exercicios/tecnicas/${id}`);
      setSuccessMsg('Técnica de treino removida.');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir técnica de treino.');
    }
  };

  const filteredExercicios = exercicios.filter((ex) => {
    const matchesSearch = ex.nome.toLowerCase().includes(search.toLowerCase());
    const matchesGroup = selectedGrupoFilter === 0 || ex.idGrupoMuscular === selectedGrupoFilter;
    return matchesSearch && matchesGroup;
  });

  const filteredTecnicas = tecnicas.filter((tec) =>
    tec.nome.toLowerCase().includes(search.toLowerCase())
  );

  const filteredGrupos = grupos.filter((g) =>
    g.nome.toLowerCase().includes(search.toLowerCase())
  );

  // --- MUSCLE GROUP TAB CRUD ---
  const handleSaveGrupoTab = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!grupoTabNome.trim()) return;

    try {
      if (editingGrupoId) {
        // Update
        await api.patch(`/exercicios/grupos/${editingGrupoId}`, { nome: grupoTabNome });
        setSuccessMsg('Grupo muscular atualizado!');
      } else {
        // Create
        await api.post('/exercicios/grupos', { nome: grupoTabNome });
        setSuccessMsg('Grupo muscular cadastrado com sucesso!');
      }

      setGrupoTabNome('');
      setEditingGrupoId(null);
      setShowGrupoTabForm(false);
      loadData();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao salvar grupo muscular.');
    }
  };

  const handleEditGrupoTab = (g: GrupoMuscular) => {
    setEditingGrupoId(g.idGrupoMuscular);
    setGrupoTabNome(g.nome);
    setShowGrupoTabForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteGrupoTab = async (id: number) => {
    if (!confirm('Deseja realmente remover este grupo muscular? Exercícios associados perderão esse grupo.')) return;
    clearMessages();

    try {
      await api.delete(`/exercicios/grupos/${id}`);
      setSuccessMsg('Grupo muscular removido.');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir grupo muscular.');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Carregando catálogo de exercícios...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Biblioteca & Catálogo</h1>
          <p>Gerencie seus exercícios, grupos musculares e técnicas de treinamento.</p>
        </div>
        
        {activeTab === 'exercicios' ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingExId(null);
              setExNome('');
              setExGrupoId(0);
              setExDesc('');
              setExVideo('');
              setShowExForm(!showExForm);
            }}
          >
            <Plus size={18} />
            <span>{showExForm ? 'Cancelar' : 'Novo Exercício'}</span>
          </button>
        ) : activeTab === 'tecnicas' ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingTecId(null);
              setTecNome('');
              setTecDesc('');
              setShowTecForm(!showTecForm);
            }}
          >
            <Plus size={18} />
            <span>{showTecForm ? 'Cancelar' : 'Nova Técnica'}</span>
          </button>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              setEditingGrupoId(null);
              setGrupoTabNome('');
              setShowGrupoTabForm(!showGrupoTabForm);
            }}
          >
            <Plus size={18} />
            <span>{showGrupoTabForm ? 'Cancelar' : 'Novo Grupo'}</span>
          </button>
        )}
      </div>

      {/* Alertas */}
      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {successMsg && (
        <div className="badge badge-success" style={{ display: 'block', padding: '0.75rem', textAlign: 'center' }}>
          {successMsg}
        </div>
      )}

      {/* --- FORMULÁRIO DE GRUPO MUSCULAR (TAB) --- */}
      {showGrupoTabForm && activeTab === 'grupos' && (
        <div className="card animate-fade-in" style={{ borderColor: 'var(--accent)' }}>
          <h2>{editingGrupoId ? 'Editar Grupo Muscular' : 'Cadastrar Novo Grupo Muscular'}</h2>
          
          <form onSubmit={handleSaveGrupoTab} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="grupoTabNome">Nome do Grupo Muscular</label>
              <input
                id="grupoTabNome"
                type="text"
                className="form-control"
                placeholder="Ex: Quadríceps, Isquiotibiais, Peitoral"
                value={grupoTabNome}
                onChange={(e) => setGrupoTabNome(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowGrupoTabForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Salvar Grupo</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- FORMULÁRIO DE EXERCÍCIO --- */}
      {showExForm && activeTab === 'exercicios' && (
        <div className="card animate-fade-in" style={{ borderColor: 'var(--accent)' }}>
          <h2>{editingExId ? 'Editar Exercício' : 'Cadastrar Novo Exercício'}</h2>
          
          <form onSubmit={handleSaveExercicio} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="exNome">Nome do Exercício</label>
                <input
                  id="exNome"
                  type="text"
                  className="form-control"
                  placeholder="Ex: Supino Reto"
                  value={exNome}
                  onChange={(e) => setExNome(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="exGrupo">Grupo Muscular</label>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ minHeight: 'unset', padding: '0.1rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => setShowGrupoForm(!showGrupoForm)}
                  >
                    <FolderPlus size={12} />
                    Novo Grupo
                  </button>
                </div>
                
                {showGrupoForm ? (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Ex: Antebraço"
                      value={newGrupoNome}
                      onChange={(e) => setNewGrupoNome(e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <button type="button" className="btn btn-primary" onClick={handleAddGrupo} style={{ minHeight: 'unset', padding: '0.5rem' }}>
                      Salvar
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowGrupoForm(false)} style={{ minHeight: 'unset', padding: '0.5rem' }}>
                      X
                    </button>
                  </div>
                ) : (
                  <select
                    id="exGrupo"
                    className="form-control"
                    value={exGrupoId}
                    onChange={(e) => setExGrupoId(Number(e.target.value))}
                    required
                  >
                    <option value={0}>Selecione...</option>
                    {grupos.map((g) => (
                      <option key={g.idGrupoMuscular} value={g.idGrupoMuscular}>{g.nome}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2">
              <div className="form-group">
                <label className="form-label" htmlFor="exDesc">Descrição / Execução</label>
                <input
                  id="exDesc"
                  type="text"
                  className="form-control"
                  placeholder="Ex:"
                  value={exDesc}
                  onChange={(e) => setExDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="exVideo">URL de Vídeo Demonstrativo (YouTube)</label>
                <input
                  id="exVideo"
                  type="text"
                  className="form-control"
                  placeholder="https://youtube.com/..."
                  value={exVideo}
                  onChange={(e) => setExVideo(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowExForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Salvar Exercício</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- FORMULÁRIO DE TÉCNICA --- */}
      {showTecForm && activeTab === 'tecnicas' && (
        <div className="card animate-fade-in" style={{ borderColor: 'var(--accent)' }}>
          <h2>{editingTecId ? 'Editar Técnica' : 'Cadastrar Nova Técnica de Treino'}</h2>
          
          <form onSubmit={handleSaveTecnica} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginTop: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="tecNome">Nome da Técnica</label>
              <input
                id="tecNome"
                type="text"
                className="form-control"
                placeholder="Ex: Rest-Pause"
                value={tecNome}
                onChange={(e) => setTecNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tecDesc">Descrição Detalhada</label>
              <input
                id="tecDesc"
                type="text"
                className="form-control"
                placeholder="Ex: Descansar de 10 a 15 segundos e continuar até nova falha."
                value={tecDesc}
                onChange={(e) => setTecDesc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowTecForm(false)}>Cancelar</button>
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                <span>Salvar Técnica</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tabs Navigation & Search */}
      <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
          <button 
            className={`btn`} 
            style={{ 
              minHeight: 'unset', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'exercicios' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'exercicios' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
            onClick={() => {
              setActiveTab('exercicios');
              setSearch('');
              setSelectedGrupoFilter(0);
              clearMessages();
            }}
          >
            <Dumbbell size={16} style={{ marginRight: '0.25rem', display: 'inline' }} />
            Exercícios
          </button>
          <button 
            className={`btn`} 
            style={{ 
              minHeight: 'unset', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'grupos' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'grupos' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
            onClick={() => {
              setActiveTab('grupos');
              setSearch('');
              setSelectedGrupoFilter(0);
              clearMessages();
            }}
          >
            <FolderPlus size={16} style={{ marginRight: '0.25rem', display: 'inline' }} />
            Grupos Musculares
          </button>
          <button 
            className={`btn`}
            style={{ 
              minHeight: 'unset', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'tecnicas' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'tecnicas' ? 'var(--accent)' : 'var(--text-secondary)'
            }}
            onClick={() => {
              setActiveTab('tecnicas');
              setSearch('');
              setSelectedGrupoFilter(0);
              clearMessages();
            }}
          >
            <Sparkles size={16} style={{ marginRight: '0.25rem', display: 'inline' }} />
            Técnicas de Treino
          </button>
        </div>

        {/* Filtro de Grupo Muscular (Apenas para Exercícios) */}
        {activeTab === 'exercicios' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--card-border)', minWidth: '180px' }}>
            <select
              className="form-control"
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 'unset', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
              value={selectedGrupoFilter}
              onChange={(e) => setSelectedGrupoFilter(Number(e.target.value))}
            >
              <option value={0} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>Todos os Grupos</option>
              {grupos.map((g) => (
                <option key={g.idGrupoMuscular} value={g.idGrupoMuscular} style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-secondary)', padding: '0.25rem 1rem', borderRadius: '8px', border: '1px solid var(--card-border)', flex: 1, maxWidth: '300px' }}>
          <input
            type="text"
            className="form-control"
            style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 'unset' }}
            placeholder={`Buscar por nome...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* --- EXERCISES TAB TABLE --- */}
      {activeTab === 'exercicios' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Exercício</th>
                  <th>Grupo Muscular</th>
                  <th>Descrição</th>
                  <th>Vídeo</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredExercicios.length > 0 ? (
                  filteredExercicios.map((ex) => (
                    <tr key={ex.idExercicio}>
                      <td style={{ fontWeight: '600' }}>{ex.nome}</td>
                      <td>
                        <span className="badge badge-success" style={{ backgroundColor: 'rgba(204, 255, 0, 0.08)', color: 'var(--accent)' }}>
                          {ex.grupoMuscular.nome}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {ex.descricao || '-'}
                      </td>
                      <td>
                        {ex.videoUrl ? (
                          <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', gap: '0.25rem' }}>
                            <Video size={14} />
                            <span>Ver Vídeo</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Nenhum</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem' }} onClick={() => handleEditExercicio(ex)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-danger" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteExercicio(ex.idExercicio)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum exercício encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TECHNIQUES TAB TABLE --- */}
      {activeTab === 'tecnicas' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Técnica</th>
                  <th>Descrição</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredTecnicas.length > 0 ? (
                  filteredTecnicas.map((tec) => (
                    <tr key={tec.idTecnica}>
                      <td style={{ fontWeight: '600', color: 'var(--accent)' }}>{tec.nome}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {tec.descricao || '-'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button className="btn btn-secondary" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem' }} onClick={() => handleEditTecnica(tec)}>
                            <Edit size={14} />
                          </button>
                          <button className="btn btn-danger" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteTecnica(tec.idTecnica)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhuma técnica de treino encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MUSCLE GROUPS TAB TABLE --- */}
      {activeTab === 'grupos' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Grupo Muscular</th>
                  <th>Total de Exercícios Associados</th>
                  <th style={{ textAlign: 'right' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrupos.length > 0 ? (
                  filteredGrupos.map((g) => {
                    const count = exercicios.filter(ex => ex.idGrupoMuscular === g.idGrupoMuscular).length;
                    return (
                      <tr key={g.idGrupoMuscular}>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{g.nome}</td>
                        <td>
                          <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                            {count} {count === 1 ? 'exercício' : 'exercícios'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem' }} onClick={() => handleEditGrupoTab(g)}>
                              <Edit size={14} />
                            </button>
                            <button className="btn btn-danger" style={{ minHeight: 'unset', padding: '0.25rem 0.5rem' }} onClick={() => handleDeleteGrupoTab(g.idGrupoMuscular)}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Nenhum grupo muscular encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
