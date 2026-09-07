import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../services/api';
import { 
  Plus, Layers, Sparkles, Edit, Trash2, 
  Video, Save, FolderPlus, X
} from 'lucide-react';
import { memoryCache } from '../services/cache';
import { toast } from 'sonner';

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
  const location = useLocation();
  const cached = memoryCache.get<any>('catalogo');
  const [activeTab, setActiveTab] = useState<'exercicios' | 'tecnicas' | 'grupos'>('exercicios');
  const [exercicios, setExercicios] = useState<Exercicio[]>(cached?.exercicios || []);
  const [tecnicas, setTecnicas] = useState<TecnicaTreino[]>(cached?.tecnicas || []);
  const [grupos, setGrupos] = useState<GrupoMuscular[]>(cached?.grupos || []);
  const [search, setSearch] = useState('');
  const [selectedGrupoFilter, setSelectedGrupoFilter] = useState<number>(0);
  
  const [loading, setLoading] = useState(!cached);

  // --- MODAL / FORM STATES ---
  // Exercise modal
  const [showExForm, setShowExForm] = useState(Boolean(location.state?.openAdd));
  const [editingExId, setEditingExId] = useState<number | null>(null);
  const [exNome, setExNome] = useState('');
  const [exGrupoId, setExGrupoId] = useState<number>(0);
  const [exDesc, setExDesc] = useState('');
  const [exVideo, setExVideo] = useState('');

  // Muscle group quick add form (inside exercise modal)
  const [showGrupoForm, setShowGrupoForm] = useState(false);
  const [newGrupoNome, setNewGrupoNome] = useState('');

  // Technique modal
  const [showTecForm, setShowTecForm] = useState(false);
  const [editingTecId, setEditingTecId] = useState<number | null>(null);
  const [tecNome, setTecNome] = useState('');
  const [tecDesc, setTecDesc] = useState('');

  // Muscle group tab modal
  const [showGrupoTabForm, setShowGrupoTabForm] = useState(false);
  const [editingGrupoId, setEditingGrupoId] = useState<number | null>(null);
  const [grupoTabNome, setGrupoTabNome] = useState('');

  const closeExModal = () => {
    setShowExForm(false);
    setEditingExId(null);
    setExNome('');
    setExGrupoId(0);
    setExDesc('');
    setExVideo('');
    setShowGrupoForm(false);
    setNewGrupoNome('');
  };

  const closeTecModal = () => {
    setShowTecForm(false);
    setEditingTecId(null);
    setTecNome('');
    setTecDesc('');
  };

  const closeGrupoTabModal = () => {
    setShowGrupoTabForm(false);
    setEditingGrupoId(null);
    setGrupoTabNome('');
  };

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showExForm) closeExModal();
        if (showTecForm) closeTecModal();
        if (showGrupoTabForm) closeGrupoTabModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExForm, showTecForm, showGrupoTabForm]);

  useEffect(() => {
    if (location.state?.openAdd) {
      setActiveTab('exercicios');
      setShowExForm(true);
    }
  }, [location.state]);

  const loadData = async () => {
    try {
      if (!cached) setLoading(true);
      
      const [exRes, tecRes, grpRes] = await Promise.all([
        api.get('/exercicios'),
        api.get('/exercicios/tecnicas'),
        api.get('/exercicios/grupos')
      ]);
      setExercicios(exRes.data);
      setTecnicas(tecRes.data);
      setGrupos(grpRes.data);
      memoryCache.set('catalogo', {
        exercicios: exRes.data,
        tecnicas: tecRes.data,
        grupos: grpRes.data
      });
    } catch (err) {
      console.error(err);
      if (!cached) toast.error('Erro ao carregar dados do catálogo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Biblioteca | TreinosApp';
    loadData();
  }, []);

  // --- EXERCISE CRUD ---
  const handleSaveExercicio = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!exNome.trim()) {
      toast.error('Informe o nome do exercício.');
      return;
    }

    if (!exGrupoId) {
      toast.error('Por favor, selecione um grupo muscular.');
      return;
    }

    try {
      if (editingExId) {
        await api.patch(`/exercicios/${editingExId}`, {
          nome: exNome.trim(),
          idGrupoMuscular: Number(exGrupoId),
          descricao: exDesc.trim() || null,
          videoUrl: exVideo.trim() || null,
        });
        toast.success('Exercício atualizado com sucesso!');
      } else {
        await api.post('/exercicios', {
          nome: exNome.trim(),
          idGrupoMuscular: Number(exGrupoId),
          descricao: exDesc.trim() || null,
          videoUrl: exVideo.trim() || null,
        });
        toast.success('Exercício cadastrado com sucesso!');
      }

      closeExModal();
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar exercício.');
    }
  };

  const handleEditExercicio = (ex: Exercicio) => {
    setEditingExId(ex.idExercicio);
    setExNome(ex.nome);
    setExGrupoId(ex.idGrupoMuscular);
    setExDesc(ex.descricao || '');
    setExVideo(ex.videoUrl || '');
    setShowExForm(true);
  };

  const handleDeleteExercicio = async (id: number) => {
    if (!confirm('Deseja realmente remover este exercício da biblioteca?')) return;

    try {
      await api.delete(`/exercicios/${id}`);
      toast.success('Exercício removido.');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir exercício.');
    }
  };

  // --- MUSCLE GROUP QUICK ADD ---
  const handleAddGrupo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGrupoNome.trim()) return;

    try {
      const res = await api.post('/exercicios/grupos', { nome: newGrupoNome.trim() });
      const updatedGrupos = [...grupos, res.data];
      setGrupos(updatedGrupos);
      setExGrupoId(res.data.idGrupoMuscular);
      setNewGrupoNome('');
      setShowGrupoForm(false);
      const curCache = memoryCache.get<any>('catalogo');
      if (curCache) {
        memoryCache.set('catalogo', { ...curCache, grupos: updatedGrupos });
      }
      toast.success('Grupo muscular cadastrado!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao cadastrar grupo muscular.');
    }
  };

  // --- TECHNIQUE CRUD ---
  const handleSaveTecnica = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tecNome.trim()) {
      toast.error('Informe o nome da técnica de treino.');
      return;
    }

    try {
      if (editingTecId) {
        await api.patch(`/exercicios/tecnicas/${editingTecId}`, {
          nome: tecNome.trim(),
          descricao: tecDesc.trim() || null,
        });
        toast.success('Técnica de treino atualizada!');
      } else {
        await api.post('/exercicios/tecnicas', {
          nome: tecNome.trim(),
          descricao: tecDesc.trim() || null,
        });
        toast.success('Técnica de treino cadastrada com sucesso!');
      }

      closeTecModal();
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar técnica.');
    }
  };

  const handleEditTecnica = (tec: TecnicaTreino) => {
    setEditingTecId(tec.idTecnica);
    setTecNome(tec.nome);
    setTecDesc(tec.descricao || '');
    setShowTecForm(true);
  };

  const handleDeleteTecnica = async (id: number) => {
    if (!confirm('Deseja realmente remover esta técnica de treino?')) return;

    try {
      await api.delete(`/exercicios/tecnicas/${id}`);
      toast.success('Técnica de treino removida.');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir técnica de treino.');
    }
  };

  // --- MUSCLE GROUP TAB CRUD ---
  const handleSaveGrupoTab = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!grupoTabNome.trim()) {
      toast.error('Informe o nome do grupo muscular.');
      return;
    }

    try {
      if (editingGrupoId) {
        await api.patch(`/exercicios/grupos/${editingGrupoId}`, { nome: grupoTabNome.trim() });
        toast.success('Grupo muscular atualizado com sucesso!');
      } else {
        await api.post('/exercicios/grupos', { nome: grupoTabNome.trim() });
        toast.success('Grupo muscular cadastrado com sucesso!');
      }

      closeGrupoTabModal();
      loadData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao salvar grupo muscular.');
    }
  };

  const handleEditGrupoTab = (g: GrupoMuscular) => {
    setEditingGrupoId(g.idGrupoMuscular);
    setGrupoTabNome(g.nome);
    setShowGrupoTabForm(true);
  };

  const handleDeleteGrupoTab = async (id: number) => {
    if (!confirm('Deseja realmente remover este grupo muscular? Exercícios associados perderão esse grupo.')) return;

    try {
      await api.delete(`/exercicios/grupos/${id}`);
      toast.success('Grupo muscular removido.');
      loadData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir grupo muscular.');
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

  if (loading && exercicios.length === 0 && tecnicas.length === 0 && grupos.length === 0) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex-between">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div className="skeleton" style={{ width: '220px', height: '28px' }} />
            <div className="skeleton" style={{ width: '320px', height: '14px' }} />
          </div>
          <div className="skeleton" style={{ width: '130px', height: '36px' }} />
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '34px' }} />
          <div className="skeleton" style={{ width: '100px', height: '34px' }} />
          <div className="skeleton" style={{ width: '100px', height: '34px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {[1, 2, 3, 4, 5, 6].map(n => (
            <div key={n} className="skeleton" style={{ height: '90px' }} />
          ))}
        </div>
      </div>
    );
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
              closeExModal();
              setShowExForm(true);
            }}
          >
            <Plus size={18} />
            <span>Novo exercício</span>
          </button>
        ) : activeTab === 'tecnicas' ? (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              closeTecModal();
              setShowTecForm(true);
            }}
          >
            <Plus size={18} />
            <span>Nova técnica</span>
          </button>
        ) : (
          <button 
            className="btn btn-primary" 
            onClick={() => {
              closeGrupoTabModal();
              setShowGrupoTabForm(true);
            }}
          >
            <Plus size={18} />
            <span>Novo grupo</span>
          </button>
        )}
      </div>

      {/* Tabs Navigation & Search */}
      <div className="card" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-2)', padding: '0.25rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <button 
            className={`btn`} 
            style={{ 
              minHeight: 'unset', 
              padding: '0.5rem 1.25rem', 
              borderRadius: '6px',
              fontSize: '0.9rem',
              backgroundColor: activeTab === 'exercicios' ? 'var(--bg-tertiary)' : 'transparent',
              color: activeTab === 'exercicios' ? 'var(--accent)' : 'var(--text-1)'
            }}
            onClick={() => {
              setActiveTab('exercicios');
              setSearch('');
              setSelectedGrupoFilter(0);
            }}
          >
            <Layers size={16} style={{ marginRight: '0.25rem', display: 'inline' }} />
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
              color: activeTab === 'grupos' ? 'var(--accent)' : 'var(--text-1)'
            }}
            onClick={() => {
              setActiveTab('grupos');
              setSearch('');
              setSelectedGrupoFilter(0);
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
              color: activeTab === 'tecnicas' ? 'var(--accent)' : 'var(--text-1)'
            }}
            onClick={() => {
              setActiveTab('tecnicas');
              setSearch('');
              setSelectedGrupoFilter(0);
            }}
          >
            <Sparkles size={16} style={{ marginRight: '0.25rem', display: 'inline' }} />
            Técnicas de Treino
          </button>
        </div>

        {/* Filtro de Grupo Muscular (Apenas para Exercícios) */}
        {activeTab === 'exercicios' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-2)', padding: '0.25rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', minWidth: '180px' }}>
            <select
              className="form-control"
              style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 'unset', color: 'var(--text-primary)', fontSize: '0.9rem', cursor: 'pointer' }}
              value={selectedGrupoFilter}
              onChange={(e) => setSelectedGrupoFilter(Number(e.target.value))}
            >
              <option value={0} style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text-primary)' }}>Todos os Grupos</option>
              {grupos.map((g) => (
                <option key={g.idGrupoMuscular} value={g.idGrupoMuscular} style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text-primary)' }}>
                  {g.nome}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Search Input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--bg-2)', padding: '0.25rem 1rem', borderRadius: '8px', border: '1px solid var(--border)', flex: 1, maxWidth: '300px' }}>
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
                        <span className="badge badge-accent">
                          {ex.grupoMuscular.nome}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-1)', fontSize: '0.9rem', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
                      <td style={{ color: 'var(--text-1)', fontSize: '0.9rem' }}>
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
                          <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-1)', border: '1px solid var(--border)' }}>
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

      {/* ========================================================================= */}
      {/* MODAL 1: EXERCÍCIO (NOVO / EDITAR) */}
      {/* ========================================================================= */}
      {showExForm && (
        <div 
          className="modal-backdrop" 
          onClick={closeExModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalExercicioTitle"
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
                    {editingExId ? 'ATUALIZAÇÃO // EXERCÍCIO' : 'CADASTRO // EXERCÍCIO'}
                  </span>
                </div>
                <h3 id="modalExercicioTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  {editingExId ? 'Editar Exercício' : 'Novo Exercício'}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeExModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExercicio} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="exNome">Nome do Exercício *</label>
                <input
                  id="exNome"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Supino Reto com Barra"
                  value={exNome}
                  onChange={(e) => setExNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label className="form-label" htmlFor="exGrupo" style={{ margin: 0 }}>Grupo Muscular *</label>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    style={{ minHeight: 'unset', padding: '0.15rem 0.5rem', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onClick={() => setShowGrupoForm(!showGrupoForm)}
                  >
                    <FolderPlus size={12} />
                    {showGrupoForm ? 'Fechar' : 'Novo Grupo'}
                  </button>
                </div>

                {showGrupoForm && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.65rem', animation: 'fadeIn 150ms var(--ease-out)' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Nome do novo grupo..."
                      value={newGrupoNome}
                      onChange={(e) => setNewGrupoNome(e.target.value)}
                      style={{ flex: 1 }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddGrupo(e);
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      onClick={handleAddGrupo} 
                      style={{ minHeight: 'unset', padding: '0.4rem 0.8rem', fontSize: '0.8125rem' }}
                    >
                      Salvar
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => setShowGrupoForm(false)} 
                      style={{ minHeight: 'unset', padding: '0.4rem 0.6rem', fontSize: '0.8125rem' }}
                      title="Cancelar"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                <select
                  id="exGrupo"
                  className="form-input"
                  value={exGrupoId}
                  onChange={(e) => setExGrupoId(Number(e.target.value))}
                  required
                >
                  <option value={0}>Selecione um grupo muscular...</option>
                  {grupos.map((g) => (
                    <option key={g.idGrupoMuscular} value={g.idGrupoMuscular}>{g.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="exDesc">Descrição / Observações de Execução</label>
                <input
                  id="exDesc"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Escápulas aduzidas, descer até a linha do peito"
                  value={exDesc}
                  onChange={(e) => setExDesc(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="exVideo">Vídeo Demonstrativo (URL YouTube)</label>
                <input
                  id="exVideo"
                  type="url"
                  className="form-input"
                  placeholder="https://youtube.com/watch?v=..."
                  value={exVideo}
                  onChange={(e) => setExVideo(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeExModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{editingExId ? 'Atualizar Exercício' : 'Salvar Exercício'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TÉCNICA (NOVA / EDITAR) */}
      {/* ========================================================================= */}
      {showTecForm && (
        <div 
          className="modal-backdrop" 
          onClick={closeTecModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalTecnicaTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {editingTecId ? 'ATUALIZAÇÃO // TÉCNICA' : 'CADASTRO // TÉCNICA'}
                  </span>
                </div>
                <h3 id="modalTecnicaTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  {editingTecId ? 'Editar Técnica de Treino' : 'Nova Técnica de Treino'}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeTecModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveTecnica} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="tecNome">Nome da Técnica *</label>
                <input
                  id="tecNome"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Rest-Pause, Drop-set, Ponto Zero"
                  value={tecNome}
                  onChange={(e) => setTecNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="tecDesc">Descrição Detalhada</label>
                <textarea
                  id="tecDesc"
                  className="form-input"
                  rows={3}
                  placeholder="Ex: Descansar de 10 a 15 segundos e continuar até nova falha concêntrica."
                  value={tecDesc}
                  onChange={(e) => setTecDesc(e.target.value)}
                />
              </div>

              <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeTecModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{editingTecId ? 'Atualizar Técnica' : 'Salvar Técnica'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: GRUPO MUSCULAR (NOVO / EDITAR) */}
      {/* ========================================================================= */}
      {showGrupoTabForm && (
        <div 
          className="modal-backdrop" 
          onClick={closeGrupoTabModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalGrupoTitle"
        >
          <div 
            className="modal-content" 
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '420px' }}
          >
            <div className="modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    {editingGrupoId ? 'ATUALIZAÇÃO // GRUPO' : 'CADASTRO // GRUPO'}
                  </span>
                </div>
                <h3 id="modalGrupoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  {editingGrupoId ? 'Editar Grupo Muscular' : 'Novo Grupo Muscular'}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close" 
                onClick={closeGrupoTabModal}
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveGrupoTab} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="grupoTabNome">Nome do Grupo Muscular *</label>
                <input
                  id="grupoTabNome"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Quadríceps, Peitoral, Dorsal"
                  value={grupoTabNome}
                  onChange={(e) => setGrupoTabNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                <button type="button" className="btn btn-secondary" onClick={closeGrupoTabModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  <span>{editingGrupoId ? 'Atualizar Grupo' : 'Salvar Grupo'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
