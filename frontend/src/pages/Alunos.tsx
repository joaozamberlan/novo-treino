import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Plus, ChevronRight } from 'lucide-react';

interface Aluno {
  idAluno: number;
  nome: string;
  email?: string | null;
  telefone?: string;
  ativo: boolean;
  dataCadastro: string;
}

export const Alunos: React.FC = () => {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [search, setSearch] = useState('');

  const [showAddForm, setShowAddForm] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');

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
      await api.post('/alunos', {
        nome,
        email: email || undefined,
        telefone: telefone || undefined,
      });

      setNome('');
      setEmail('');
      setTelefone('');
      setShowAddForm(false);
      fetchAlunos();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao adicionar aluno.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Carregando seus alunos...
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: '1.25rem' }}>
        <h1>Meus Alunos</h1>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAddForm(!showAddForm)}
        >
          <Plus size={16} />
          <span>{showAddForm ? 'Cancelar' : '+ Novo'}</span>
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
        <div className="card" style={{ marginBottom: '0.75rem' }}>
          <form onSubmit={handleAddAluno}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="nomeAluno">Nome</label>
                <input
                  id="nomeAluno"
                  type="text"
                  className="form-input"
                  placeholder="Nome do aluno"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="emailAluno">Email</label>
                <input
                  id="emailAluno"
                  type="email"
                  className="form-input"
                  placeholder="email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="telAluno">Telefone</label>
                <input
                  id="telAluno"
                  type="text"
                  className="form-input"
                  placeholder="(00) 90000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={actionLoading}
              >
                {actionLoading ? 'Salvando...' : 'Salvar'}
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
        <div style={{ borderRadius: 'var(--radius, 12px)', border: '1px solid var(--card-border)', overflow: 'hidden' }}>
          <div className="student-list">
            {filteredAlunos.map((aluno) => (
              <Link
                key={aluno.idAluno}
                to={`/alunos/${aluno.idAluno}/treinos`}
                className="student-item"
              >
                <span className="student-item-name">{aluno.nome}</span>
                <span className="student-item-meta">
                  {aluno.email}
                  <span className={`badge ${aluno.ativo ? 'badge-success' : 'badge-danger'}`}>
                    {aluno.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </span>
                <span className="student-item-arrow">
                  <ChevronRight size={18} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Nenhum aluno encontrado.
        </div>
      )}
    </div>
  );
};
