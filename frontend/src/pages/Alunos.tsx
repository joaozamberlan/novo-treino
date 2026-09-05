import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Plus, ChevronRight, Edit2, Trash2, X } from 'lucide-react';

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
  const [alunos, setAlunos] = useState<Aluno[]>([]);
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

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAlunos = async () => {
    try {
      const response = await api.get('/alunos');
      setAlunos(response.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar lista de alunos.');
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

      setAlunos(prev => [res.data, ...prev]);
      setNome('');
      setEmail('');
      setTelefone('');
      setShowAddForm(false);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao adicionar aluno.');
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

    // Optimistic UI
    setAlunos(prev =>
      prev.map(a => (a.idAluno === editingAlunoId ? { ...a, ...updatedData } : a))
    );

    const targetId = editingAlunoId;
    cancelEdit();

    try {
      await api.patch(`/alunos/${targetId}`, updatedData);
    } catch (err: any) {
      console.error('Erro ao atualizar aluno:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar dados do aluno.');
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

    // Optimistic UI
    setAlunos(prev => prev.filter(a => a.idAluno !== aluno.idAluno));

    try {
      await api.delete(`/alunos/${aluno.idAluno}`);
    } catch (err: any) {
      console.error('Erro ao excluir aluno:', err);
      setError('Erro ao excluir aluno no servidor.');
      fetchAlunos();
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-1)' }}>
        Carregando alunos...
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
                style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem' }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                  <span className="student-item-name" style={{ fontWeight: 600 }}>{aluno.nome}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-1)' }}>
                    {aluno.email && <span>{aluno.email}</span>}
                    {aluno.telefone && <span>• {aluno.telefone}</span>}
                    <span className={`badge ${aluno.ativo ? 'badge-success' : 'badge-danger'}`} style={{ height: '18px', padding: '0 0.4rem', fontSize: '0.65rem' }}>
                      {aluno.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={(e) => e.stopPropagation()}>
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
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-1)' }}>
          Nenhum aluno encontrado.
        </div>
      )}
    </div>
  );
};

