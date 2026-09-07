import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Search, Mail, Calendar, User, Phone, ShieldAlert, Key, Copy, Check, RefreshCw, X
} from 'lucide-react';
import { toast } from 'sonner';

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

  const [resetModalProf, setResetModalProf] = useState<Professional | null>(null);
  const [newTempPassword, setNewTempPassword] = useState('');
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let res = '';
    for (let i = 0; i < 10; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewTempPassword(res);
    setCopiedPassword(false);
  };

  const handleOpenResetModal = (prof: Professional) => {
    setResetModalProf(prof);
    generateRandomPassword();
  };

  const handleCopyPassword = () => {
    if (newTempPassword) {
      navigator.clipboard.writeText(newTempPassword);
      setCopiedPassword(true);
      toast.success('Senha copiada para a área de transferência!');
      setTimeout(() => setCopiedPassword(false), 2500);
    }
  };

  const handleSaveResetPassword = async () => {
    if (!resetModalProf) return;
    if (!newTempPassword || newTempPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.patch(`/admin/profissionais/${resetModalProf.idProfissional}/reset-senha`, {
        novaSenha: newTempPassword,
      });
      toast.success(`Senha de ${resetModalProf.nome} redefinida com sucesso!`);
      setResetModalProf(null);
      setNewTempPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao redefinir senha.');
    } finally {
      setSavingPassword(false);
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
          <div style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>Total de Clientes</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem' }}>{professionals.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>Contas Ativas (Pagas)</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--success)' }}>
            {professionals.filter(p => p.ativo).length}
          </div>
        </div>
        <div className="card">
          <div style={{ fontSize: '0.85rem', color: 'var(--text-1)' }}>Aprovações Pendentes</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', marginTop: '0.25rem', color: 'var(--warning)' }}>
            {professionals.filter(p => !p.ativo).length}
          </div>
        </div>
      </div>

      {/* Barra de Busca */}
      <div className="card" style={{ padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: 'var(--bg-2)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border)' }}>
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
                <th>Treinador</th>
                <th>Contato</th>
                <th>Cadastro</th>
                <th>Status & Nível</th>
                <th style={{ textAlign: 'right' }}>Ações de Acesso</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? (
                filtered.map((prof) => (
                  <tr key={prof.idProfissional}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ 
                          width: '38px', 
                          height: '38px', 
                          borderRadius: '50%', 
                          backgroundColor: 'var(--bg-tertiary)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          border: '1px solid var(--border)',
                          flexShrink: 0
                        }}>
                          {prof.logoUrl ? (
                            <img src={prof.logoUrl} alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <User size={16} style={{ color: 'var(--text-1)' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: '700', color: 'var(--text-0)', fontSize: '0.9rem' }}>{prof.nome}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-2)', marginTop: '2px' }}>
                            CREF: {prof.cref} • {prof.profissao}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', fontSize: '0.8rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-1)' }}>
                          <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                          {prof.email}
                        </span>
                        {prof.telefone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-2)' }}>
                            <Phone size={12} style={{ color: 'var(--text-muted)' }} />
                            {prof.telefone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem', color: 'var(--text-1)' }}>
                        <Calendar size={12} style={{ color: 'var(--text-muted)' }} />
                        {new Date(prof.dataCadastro).toLocaleDateString()}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' }}>
                        <span className={`badge ${prof.ativo ? 'badge-success' : 'badge-danger'}`}>
                          {prof.ativo ? 'Ativo' : 'Pendente'}
                        </span>
                        {prof.role === 'SUPERADMIN' ? (
                          <span className="badge" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                            SuperAdmin
                          </span>
                        ) : (
                          <span className="badge" style={{ backgroundColor: 'var(--bg-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}>
                            Treinador
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {prof.role === 'SUPERADMIN' && prof.email === 'admin@treinosapp.com' ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sistema (Fixo)</span>
                      ) : (
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleOpenResetModal(prof)}
                            className="btn btn-secondary"
                            title="Redefinir Senha Temporária do Treinador"
                            style={{ 
                              minHeight: 'unset', 
                              height: '30px',
                              padding: '0 0.65rem', 
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                            }}
                          >
                            <Key size={12} />
                            <span>Senha</span>
                          </button>

                          <button
                            onClick={() => handleToggleStatus(prof.idProfissional, prof.ativo)}
                            className="btn"
                            style={{ 
                              minHeight: 'unset', 
                              height: '30px',
                              padding: '0 0.65rem', 
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center',
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
                              height: '30px',
                              padding: '0 0.65rem', 
                              fontSize: '0.78rem',
                              fontWeight: 600,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            {prof.role === 'SUPERADMIN' ? 'Tirar Super' : 'Promover'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-1)' }}>
                    Nenhum profissional encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal: Redefinir Senha do Treinador ─── */}
      {resetModalProf && (
        <div
          className="modal-overlay"
          onClick={() => setResetModalProf(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="modal-card animate-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--bg-1)',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-l)',
              padding: '1.75rem',
              maxWidth: '460px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-border)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Key size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Redefinir Senha</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>ADMIN // CONTROLE DE ACESSO</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalProf(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-2)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: '1.5' }}>
              Defina uma senha temporária para o treinador <strong>{resetModalProf.nome}</strong> ({resetModalProf.email}). Ele poderá alterá-la após o login em Configurações.
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Nova Senha Temporária</label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <RefreshCw size={12} />
                  <span>Gerar aleatória</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  value={newTempPassword}
                  onChange={(e) => setNewTempPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, letterSpacing: '0.05em' }}
                />
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="btn btn-secondary"
                  title="Copiar senha"
                  style={{ padding: '0 0.85rem' }}
                >
                  {copiedPassword ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-2)',
              backgroundColor: 'var(--bg-2)',
              padding: '0.75rem 0.85rem',
              borderRadius: 'var(--radius-s)',
              border: '1px solid var(--border)',
              marginBottom: '1.5rem',
              lineHeight: '1.45',
            }}>
              💡 <strong>Dica:</strong> Copie a senha e envie via WhatsApp ou e-mail para o treinador. Ele conseguirá fazer login imediatamente com essa credencial.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setResetModalProf(null)}
                disabled={savingPassword}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSaveResetPassword}
                disabled={savingPassword || !newTempPassword}
              >
                {savingPassword ? 'Salvando...' : 'Salvar Nova Senha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
