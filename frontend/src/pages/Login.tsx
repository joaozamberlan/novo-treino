import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, Check, Clock, Cloud, HardDrive, Sliders, KeyRound, Sparkles, X } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
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
    <div className="login-wrapper">
      {/* ─── Left Panel: High Impact Brand & Interactive Mockup ─── */}
      <div className="login-left-panel">
        <div className="login-brand-header">
          <div className="login-brand-pill">
            TREINOS // APP • MOTOR DE PRESCRIÇÃO
          </div>
          <h1 className="login-hero-title">
            Estrutura, precisão e velocidade <span>na prescrição de treinos.</span>
          </h1>
          <p className="login-hero-desc">
            Organize periodizações, registre cargas e volumes sem atrito e entregue prescrições limpas e diretas aos seus alunos.
          </p>
        </div>

        {/* Live Interactive Workout Card Mockup */}
        <div className="login-card-preview">
          <div className="login-card-preview-head">
            <div>
              <div className="login-card-tag">EXERCÍCIO 01 // PEITORAL & OMBRO</div>
              <div className="login-card-name">Supino Inclinado com Halteres</div>
            </div>
            <div className="login-card-pill-muscle">PEITORAL SUPERIOR</div>
          </div>

          {/* Sets Rows */}
          <div className="login-mock-row completed">
            <div className="mock-badge-num">1</div>
            <div><strong>12 reps</strong></div>
            <div>30 kg</div>
            <div><span className="mock-pr-tag">PR +2.5kg</span></div>
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} strokeWidth={3} />
            </div>
          </div>

          <div className="login-mock-row completed">
            <div className="mock-badge-num">2</div>
            <div><strong>10 reps</strong></div>
            <div>32 kg</div>
            <div style={{ color: 'var(--text-2)' }}>RIR 1</div>
            <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Check size={14} strokeWidth={3} />
            </div>
          </div>

          <div className="login-mock-row" style={{ borderColor: 'var(--accent)', background: 'var(--accent-dim)' }}>
            <div className="mock-badge-num" style={{ background: 'var(--accent)', color: '#fff' }}>3</div>
            <div><strong>8-10 reps</strong></div>
            <div>34 kg</div>
            <div style={{ color: 'var(--accent)', fontWeight: 700 }}>REST-PAUSE</div>
            <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, fontWeight: 700 }}>
              <Clock size={12} strokeWidth={2.5} />
              <span>90s</span>
            </div>
          </div>
        </div>

        {/* Left Footer: Clean Technical Highlights (Zero emojis) */}
        <div className="login-left-footer">
          <div className="login-tech-feature">
            <Cloud size={14} color="var(--accent)" strokeWidth={2.2} />
            <span>Sincronização em Nuvem</span>
          </div>
          <div className="login-tech-feature">
            <HardDrive size={14} color="var(--accent)" strokeWidth={2.2} />
            <span>Armazenamento Offline Nativo</span>
          </div>
          <div className="login-tech-feature">
            <Sliders size={14} color="var(--accent)" strokeWidth={2.2} />
            <span>Cálculo Dinâmico de Séries e Cargas</span>
          </div>
        </div>
      </div>

      {/* ─── Right Panel: Form Box ─── */}
      <div className="login-right-panel">
        <div className="login-form-container">
          <div className="login-form-eyebrow">ACESSO RESTRITO // TREINADOR</div>
          <h2 className="login-form-title">Entrar na plataforma</h2>
          <p className="login-form-sub">Informe suas credenciais para gerenciar prescrições.</p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1.15rem' }}>
              <div className="form-label-row" style={{ marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="email">E-mail Profissional</label>
              </div>
              <div className="login-input-wrap">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="exemplo@treinador.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <div className="form-label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" htmlFor="senha" style={{ marginBottom: 0 }}>Senha de Acesso</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: 'var(--accent)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
                >
                  Esqueceu a senha?
                </button>
              </div>
              <div className="login-input-wrap">
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              <span>{loading ? 'Acessando…' : 'Acessar Painel'}</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </form>

          <div className="login-footer-support">
            Não possui uma conta? <Link to="/register">Criar conta</Link>
          </div>
        </div>
      </div>

      {/* ─── Modal: Esqueceu a Senha ─── */}
      {showForgotModal && (
        <div 
          className="modal-overlay" 
          onClick={() => setShowForgotModal(false)}
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
              maxWidth: '440px',
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
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Recuperação de Senha</h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>ACESSO // SUPORTE</span>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowForgotModal(false)}
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

            <div style={{ fontSize: '0.875rem', color: 'var(--text-1)', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p>
                Para sua segurança, a redefinição de acesso é realizada mediante validação da equipe de administração.
              </p>

              <div style={{
                backgroundColor: 'var(--bg-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-m)',
                padding: '0.85rem 1rem',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--text-0)', marginBottom: '0.35rem' }}>
                  Como recuperar seu acesso:
                </div>
                <ol style={{ paddingLeft: '1.2rem', margin: 0, fontSize: '0.8125rem', color: 'var(--text-1)', lineHeight: '1.5' }}>
                  <li>Solicite a redefinição ao <strong>Administrador</strong> do sistema.</li>
                  <li>O administrador gerará uma <strong>senha temporária</strong> para sua conta.</li>
                  <li>Após entrar na plataforma, você poderá cadastrar sua nova senha em <strong>Configurações &gt; Segurança</strong>.</li>
                </ol>
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-dim)',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-s)',
                border: '1px solid var(--accent-border)',
              }}>
                <Sparkles size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Em breve:</strong> O envio automático de link de redefinição por e-mail será disponibilizado em atualizações futuras.
                </span>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowForgotModal(false)}
                style={{ width: '100%', height: '42px', fontWeight: 700 }}
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
