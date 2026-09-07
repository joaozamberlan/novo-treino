import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { Plus, ChevronRight, Edit2, Trash2, X, Users } from 'lucide-react';
import { memoryCache } from '../services/cache';

interface Aluno {
  idAluno: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  dataCadastro: string;
}

export const Alunos: React.FC = () => {
  const navigate = useNavigate();
  const cachedAlunos = memoryCache.get<Aluno[]>('alunos');
  const [alunos, setAlunos] = useState<Aluno[]>(cachedAlunos || []);
  const [search, setSearch] = useState('');

  // Add form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

  // Edit form state
  const [editingAlunoId, setEditingAlunoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);

  // Se já tem cache, não bloqueia com loading (0ms de espera)
  const [loading, setLoading] = useState(!cachedAlunos);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAlunos = async () => {
    try {
      const response = await api.get('/alunos');
      setAlunos(response.data);
      memoryCache.set('alunos', response.data);
    } catch (err) {
      console.error(err);
      if (!cachedAlunos) {
        setError('Erro ao carregar lista de alunos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Alunos | TreinosApp';
    fetchAlunos();
  }, []);

  // Fecha modais com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddForm) setShowAddForm(false);
        if (editingAlunoId) cancelEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddForm, editingAlunoId]);

  const handleAddAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setError('');

    try {
      const res = await api.post('/alunos', {
        nome,
        email: email || undefined,
        telefone: telefone || undefined,
      });

      const next = [res.data, ...alunos];
      setAlunos(next);
      memoryCache.set('alunos', next);
      setNome('');
      setEmail('');
      setTelefone('');
      setShowAddForm(false);
      toast.success('Aluno cadastrado com sucesso!');
    } catch (err: any) {
      console.error(err);
      const errText = err.response?.data?.message || 'Erro ao adicionar aluno.';
      setError(errText);
      toast.error(errText);
    } finally {
      setActionLoading(false);
    }
  };

  const startEditAluno = (aluno: Aluno, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingAlunoId(aluno.idAluno);
    setEditNome(aluno.nome);
    setEditEmail(aluno.email || '');
    setEditTelefone(aluno.telefone || '');
    setEditAtivo(aluno.ativo);
  };

  const cancelEdit = () => {
    setEditingAlunoId(null);
    setEditNome('');
    setEditEmail('');
    setEditTelefone('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlunoId) return;

    setActionLoading(true);
    setError('');

    const updatedData = {
      nome: editNome,
      email: editEmail || null,
      telefone: editTelefone || null,
      ativo: editAtivo,
    };

    // Optimistic UI + Cache
    const nextList = alunos.map(a => (a.idAluno === editingAlunoId ? { ...a, ...updatedData } : a));
    setAlunos(nextList);
    memoryCache.set('alunos', nextList);

    const targetId = editingAlunoId;
    cancelEdit();

    try {
      await api.patch(`/alunos/${targetId}`, updatedData);
      toast.success('Dados do aluno atualizados!');
    } catch (err: any) {
      console.error('Erro ao atualizar aluno:', err);
      const errText = err.response?.data?.message || 'Erro ao atualizar dados do aluno.';
      setError(errText);
      toast.error(errText);
      fetchAlunos();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAluno = async (aluno: Aluno, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!confirm(`Tem certeza que deseja excluir o aluno "${aluno.nome}" e todo o histórico de treinos?`)) {
      return;
    }

    // Optimistic UI + Cache
    const nextList = alunos.filter(a => a.idAluno !== aluno.idAluno);
    setAlunos(nextList);
    memoryCache.set('alunos', nextList);
    memoryCache.invalidate(`visao-geral-${aluno.idAluno}`);

    try {
      await api.delete(`/alunos/${aluno.idAluno}`);
      toast.success('Aluno removido com sucesso.');
    } catch (err: any) {
      console.error('Erro ao excluir aluno:', err);
      setError('Erro ao excluir aluno no servidor.');
      toast.error('Erro ao excluir aluno no servidor.');
      fetchAlunos();
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(search.toLowerCase())
  );

  // Skeleton Loading elegante se não houver dados em cache ainda
  if (loading && alunos.length === 0) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="flex-between">
          <h1>Alunos</h1>
          <div className="skeleton" style={{ width: '110px', height: '32px' }} />
        </div>
        <div className="skeleton" style={{ height: '38px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="skeleton" style={{ height: '62px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
            <span style={{ width: '7px', height: '7px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              GESTÃO DE ALUNOS // BASE ATIVA
            </span>
          </div>
          <h1 style={{ margin: 0 }}>Alunos</h1>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowAddForm(true);
            cancelEdit();
          }}
          style={{ gap: '0.35rem', minHeight: '36px', padding: '0 0.85rem' }}
        >
          <Plus size={16} />
          <span>Novo aluno</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          type="text"
          className="topbar-search"
          placeholder="Buscar aluno por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Student List */}
      {filteredAlunos.length > 0 ? (
        <div style={{ borderRadius: 'var(--radius-l)', border: '1px solid var(--border)', overflow: 'hidden' }}>
          <div className="student-list">
            {filteredAlunos.map((aluno) => (
              <div
                key={aluno.idAluno}
                className="student-item"
                onClick={() => navigate(`/alunos/${aluno.idAluno}/treinos`)}
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.875rem 1rem' }}
              >
                {/* Avatar + info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', minWidth: 0, flex: 1 }}>
                  <div style={{
                    width: '36px', height: '36px',
                    borderRadius: '50%',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--accent)',
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    flexShrink: 0,
                    letterSpacing: '-0.01em',
                  }}>
                    {aluno.nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div className="student-item-name" style={{ fontWeight: 600, marginBottom: '0.15rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{aluno.nome}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-1)' }}>
                      {aluno.email && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{aluno.email}</span>}
                      {aluno.telefone && <span>· {aluno.telefone}</span>}
                      <span className={`badge ${aluno.ativo ? 'badge-success' : 'badge-danger'}`}>
                        {aluno.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="exercise-action-btn accent"
                    onClick={(e) => startEditAluno(aluno, e)}
                    title="Editar informações do aluno"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="exercise-action-btn danger"
                    onClick={(e) => handleDeleteAluno(aluno, e)}
                    title="Excluir aluno"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="exercise-action-btn"
                    onClick={() => navigate(`/alunos/${aluno.idAluno}/treinos`)}
                    title="Abrir fichas de treino"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', gap: '0.75rem',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-l)',
          color: 'var(--text-2)',
        }}>
          <Users size={32} style={{ color: 'var(--text-2)', opacity: 0.5 }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-1)' }}>
            {search ? `Nenhum aluno encontrado para "${search}"` : 'Nenhum aluno cadastrado ainda'}
          </div>
          {!search && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setShowAddForm(true); cancelEdit(); }}
              style={{ marginTop: '0.25rem' }}
            >
              <Plus size={14} />
              Adicionar primeiro aluno
            </button>
          )}
        </div>
      )}

      {/* Modal de Cadastro de Aluno */}
      {showAddForm && (
        <div 
          className="modal-backdrop" 
          onClick={() => setShowAddForm(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalNovoAlunoTitle"
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
                    CADASTRO // NOVO ALUNO
                  </span>
                </div>
                <h3 id="modalNovoAlunoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Novo Aluno
                </h3>
              </div>
              <button 
                type="button"
                className="btn btn-ghost btn-icon" 
                onClick={() => setShowAddForm(false)} 
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAluno} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="nomeAluno">Nome completo *</label>
                <input
                  id="nomeAluno"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Lucas Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="emailAluno">E-mail</label>
                <input
                  id="emailAluno"
                  type="email"
                  className="form-input"
                  placeholder="lucas@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="telAluno">Telefone / WhatsApp</label>
                <input
                  id="telAluno"
                  type="tel"
                  className="form-input"
                  placeholder="(00) 90000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Aluno */}
      {editingAlunoId && (
        <div 
          className="modal-backdrop" 
          onClick={cancelEdit}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalEditAlunoTitle"
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
                    CONFIGURAÇÃO // ATUALIZAR DADOS
                  </span>
                </div>
                <h3 id="modalEditAlunoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Editar Aluno
                </h3>
              </div>
              <button 
                type="button"
                className="btn btn-ghost btn-icon" 
                onClick={cancelEdit} 
                title="Fechar"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div className="form-group">
                <label className="form-label">Nome completo *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-input"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  className="form-input"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status do Aluno</label>
                <select
                  className="form-input"
                  value={editAtivo ? 'true' : 'false'}
                  onChange={(e) => setEditAtivo(e.target.value === 'true')}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={cancelEdit}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

