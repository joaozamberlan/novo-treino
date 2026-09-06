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
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <h1>Alunos</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            setShowAddForm(!showAddForm);
            cancelEdit();
          }}
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cancelar' : 'Novo aluno'}</span>
        </button>
      </div>

      {/* Error message */}
      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Inline Add Form */}
      {showAddForm && (
        <div className="card animate-in" style={{ marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem' }}>Novo aluno</h3>
          <form onSubmit={handleAddAluno}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label" htmlFor="nomeAluno">Nome completo</label>
                <input
                  id="nomeAluno"
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="Nome do aluno"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label" htmlFor="emailAluno">Email</label>
                <input
                  id="emailAluno"
                  type="email"
                  className="form-input form-input-sm"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="telAluno">Telefone ou WhatsApp</label>
                <input
                  id="telAluno"
                  type="text"
                  className="form-input form-input-sm"
                  placeholder="(00) 90000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={actionLoading}
              >
                {actionLoading ? 'Salvando...' : 'Cadastrar Aluno'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal / Card de Edição de Aluno */}
      {editingAlunoId && (
        <div className="card animate-in" style={{ marginBottom: '1rem', border: '1px solid var(--accent)' }}>
          <div className="flex-between" style={{ marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent)' }}>Editar dados do aluno</h3>
            <button className="btn btn-ghost btn-icon" onClick={cancelEdit} title="Fechar">
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSaveEdit}>
            <div className="form-row">
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Nome</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input form-input-sm"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">WhatsApp</label>
                <input
                  type="text"
                  className="form-input form-input-sm"
                  value={editTelefone}
                  onChange={(e) => setEditTelefone(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input form-input-sm"
                  value={editAtivo ? 'true' : 'false'}
                  onChange={(e) => setEditAtivo(e.target.value === 'true')}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={cancelEdit}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={actionLoading}
              >
                {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom: '0.75rem' }}>
        <input
          type="text"
          className="topbar-search"
          placeholder="Buscar por nome..."
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
                    border: '1px solid rgba(204,255,0,0.15)',
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
    </div>
  );
};

