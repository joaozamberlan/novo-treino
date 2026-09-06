import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, CheckCircle2 } from 'lucide-react';

const features = [
  'Prescreva fichas de treino personalizadas',
  'Compartilhe via link ou QR code com alunos',
  'Biblioteca com centenas de exercícios e técnicas',
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Entrar | TreinosApp';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, senha);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Credenciais inválidas. Verifique seu e-mail e senha.'
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
            <h2>Entrar na conta</h2>
            <p>Bem-vindo de volta.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
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
                placeholder="••••••••"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', height: '42px', fontSize: '0.875rem', marginTop: '0.25rem' }}
              disabled={loading}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="auth-footer-text">
            Não tem uma conta?{' '}
            <Link to="/register">Criar conta</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
