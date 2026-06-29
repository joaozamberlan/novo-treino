import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Search, Mail, Calendar, User, Phone, ShieldAlert
} from 'lucide-react';

interface Professional {
  idProfissional: number;
  nome: string;
  email: string;
  cref: string;
  profissao: string;
  telefone?: string;
  instagram?: string;
  logoUrl?: string;
  ativo: boolean;
  role: string;
  dataCadastro: string;
}

export const Admin: React.FC = () => {
  const { user } = useAuth();
  
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Safeguard: Redirect non-admins
  if (!user || user.role !== 'SUPERADMIN') {
    return <Navigate to="/" replace />;
  }

  const loadProfessionals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/profissionais');
      setProfessionals(response.data);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar lista de profissionais.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Painel Admin | TreinosApp';
    loadProfessionals();
  }, []);

  const handleToggleStatus = async (idProfissional: number, currentStatus: boolean) => {
    setError('');
    setSuccess('');
    
    try {
      const targetStatus = !currentStatus;
      await api.patch(`/admin/profissionais/${idProfissional}/status`, {
        ativo: targetStatus
      });
      
      setSuccess(`Status do profissional atualizado com sucesso!`);
      loadProfessionals();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao atualizar status do profissional.');
    }
  };

  const handleToggleRole = async (idProfissional: number, currentRole: string) => {
    setError('');
    setSuccess('');
    
    try {
      const targetRole = currentRole === 'SUPERADMIN' ? 'USER' : 'SUPERADMIN';
      await api.patch(`/admin/profissionais/${idProfissional}/role`, {
        role: targetRole
      });
      
      setSuccess(`Cargo do profissional atualizado com sucesso!`);
      loadProfessionals();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao atualizar cargo do profissional.');
    }
  };

  const filtered = professionals.filter((p) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.cref.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Carregando painel de administração...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={32} style={{ color: 'var(--accent)' }} />
          Painel do SuperAdmin
        </h1>
        <p>Aprove novas contas, gerencie acessos e defina cargos de SuperAdmin no TreinosApp.</p>
      </div>

      {/* Alertas */}
      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {success && (
        <div className="badge badge-success" style={{ display: 'block', padding: '0.75rem', textAlign: 'center' }}>
          {success}
        </div>
      )}

      {/* Estatísticas Rápidas de Contas */}
      <div className="grid grid-cols-3">
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total de Clientes</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem' }}>{professionals.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Contas Ativas (Pagas)</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--success)' }}>
            {professionals.filter(p => p.ativo).length}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Aprovações Pendentes</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--warning)' }}>
            {professionals.filter(p => !p.ativo).length}
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
          <Search size={18} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0, minHeight: 'unset' }}
            placeholder="Buscar por nome, email ou CREF..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de Profissionais */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Profissional</th>
                <th>Contato</th>
                <th>CREF / Cargo</th>
                <th>Cadastro</th>
                <th>Tipo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ação de Acesso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((prof) => (
                  <tr key={prof.idProfissional}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--bg-tertiary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '1px solid var(--card-border)'
                        }}>
                          {prof.logoUrl ? (
                            <img src={prof.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <User size={16} style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{prof.nome}</div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>ID: {prof.idProfissional}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem', fontSize: '0.9rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                          {prof.email}
                        </span>
                        {prof.telefone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                            {prof.telefone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div>
                        <div style={{ fontWeight: '500' }}>CREF: {prof.cref}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{prof.profissao}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.9rem' }}>
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        {new Date(prof.dataCadastro).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <span className="badge" style={{ backgroundColor: prof.role === 'SUPERADMIN' ? 'rgba(204,255,0,0.1)' : 'rgba(255,255,255,0.05)', color: prof.role === 'SUPERADMIN' ? 'var(--accent)' : 'var(--text-secondary)', border: '1px solid var(--card-border)' }}>
                        {prof.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${prof.ativo ? 'badge-success' : 'badge-danger'}`}>
                        {prof.ativo ? 'Ativo (Aprovado)' : 'Pendente (Bloqueado)'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {prof.role === 'SUPERADMIN' && prof.email === 'admin@treinosapp.com' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sistema (Fixo)</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            onClick={() => handleToggleStatus(prof.idProfissional, prof.ativo)}
                            className="btn"
                            style={{ 
                              minHeight: 'unset', 
                              padding: '0.4rem 0.8rem', 
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              gap: '0.25rem',
                              backgroundColor: prof.ativo ? 'rgba(239, 68, 68, 0.1)' : 'var(--accent)',
                              color: prof.ativo ? 'var(--danger)' : '#000',
                              border: prof.ativo ? '1px solid rgba(239, 68, 68, 0.2)' : 'none'
                            }}
                          >
                            {prof.ativo ? 'Suspender' : 'Aprovar'}
                          </button>

                          <button
                            onClick={() => handleToggleRole(prof.idProfissional, prof.role)}
                            className="btn btn-secondary"
                            style={{ 
                              minHeight: 'unset', 
                              padding: '0.4rem 0.8rem', 
                              fontSize: '0.85rem',
                              display: 'inline-flex',
                              gap: '0.25rem'
                            }}
                          >
                            {prof.role === 'SUPERADMIN' ? 'Remover Super' : 'Tornar Super'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    Nenhum profissional encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
