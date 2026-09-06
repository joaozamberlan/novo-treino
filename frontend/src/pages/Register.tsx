import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, CheckCircle2 } from 'lucide-react';

const features = [
  'Prescreva fichas de treino personalizadas',
  'Compartilhe via link ou QR code com alunos',
  'Biblioteca com centenas de exercícios e técnicas',
];

export const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cref, setCref] = useState('');
  const [profissao, setProfissao] = useState('Personal Trainer');
  const [telefone, setTelefone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Cadastrar | TreinosApp';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await register({
        nome,
        email,
        senha,
        cref,
        profissao,
        telefone: telefone || undefined,
        instagram: instagram || undefined,
      });
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Erro ao cadastrar. Verifique os dados inseridos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-split">
      {/* ─── Left panel: branding ─── */}
      <div className="auth-panel-left">
        <div className="auth-panel-left-inner animate-fade-in">
          <div className="auth-brand">
            <Dumbbell size={24} />
            <span>TreinosApp</span>
          </div>

          <h1 className="auth-headline">
            Prescrição de treinos para profissionais sérios.
          </h1>

          <ul className="auth-features">
            {features.map((f, i) => (
              <li key={i} className="auth-feature-item">
                <CheckCircle2 size={15} className="auth-feature-icon" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ─── Right panel: form ─── */}
      <div className="auth-panel-right">
        <div className="auth-form-box animate-fade-in">
          <div className="auth-form-header">
            <h2>Criar conta</h2>
            <p>Cadastro de profissional.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label className="form-label" htmlFor="nome">Nome completo</label>
              <input
                id="nome"
                type="text"
                className="form-input"
                placeholder="Ex: Prof. João Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="seuemail@exemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="new-password"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cref">CREF</label>
                <input
                  id="cref"
                  type="text"
                  className="form-input"
                  placeholder="000000-G/UF"
                  value={cref}
                  onChange={(e) => setCref(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profissao">Profissão</label>
                <input
                  id="profissao"
                  type="text"
                  className="form-input"
                  placeholder="Personal Trainer"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="telefone">Telefone <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  id="telefone"
                  type="text"
                  className="form-input"
                  placeholder="(00) 90000-0000"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="instagram">Instagram <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(opcional)</span></label>
                <input
                  id="instagram"
                  type="text"
                  className="form-input"
                  placeholder="@seuperfil"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px', fontSize: '0.875rem', marginTop: '0.25rem' }}
              disabled={loading}
            >
              {loading ? 'Cadastrando…' : 'Criar conta'}
            </button>
          </form>

          <p className="auth-footer-text">
            Já possui uma conta?{' '}
            <Link to="/login">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
