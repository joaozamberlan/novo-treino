import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, Check, Clock, Cloud, HardDrive, Sliders } from 'lucide-react';

export const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="login-wrapper">
      {/* ─── Left Panel: High Impact Brand & Interactive Mockup ─── */}
      <div className="login-left-panel">
        <div className="login-brand-header">
          <div className="login-brand-pill">
            TREINOS // APP • MOTOR DE PRESCRIÇÃO
          </div>
          <h1 className="login-hero-title">
            Prescreva com estrutura <span>e sem complicações.</span>
          </h1>
          <p className="login-hero-desc">
            Organize periodizações, acompanhe o histórico de cargas e entregue fichas limpas em link interativo ou PDF para cada aluno.
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

        {/* Left Footer: Clean Technical Highlights */}
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
        <div className="login-form-container register-form-container">
          <div className="login-form-eyebrow">NOVO TREINADOR // CADASTRO</div>
          <h2 className="login-form-title">Criar conta</h2>
          <p className="login-form-sub">Preencha seus dados para começar a prescrever treinos.</p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="nome">Nome completo</label>
              <div className="login-input-wrap">
                <input
                  id="nome"
                  type="text"
                  className="form-input"
                  placeholder="Ex: Prof. João Silva"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="email">E-mail de acesso</label>
              <div className="login-input-wrap">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="treinador@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="senha">Senha</label>
              <div className="login-input-wrap">
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder="Mínimo 6 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cref">CREF</label>
                <div className="login-input-wrap">
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
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="profissao">Profissão</label>
                <div className="login-input-wrap">
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
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="telefone">
                  Telefone <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <div className="login-input-wrap">
                  <input
                    id="telefone"
                    type="text"
                    className="form-input"
                    placeholder="(00) 90000-0000"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="instagram">
                  Instagram <span style={{ color: 'var(--text-2)', fontWeight: 400 }}>(opcional)</span>
                </label>
                <div className="login-input-wrap">
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
            </div>

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                'Criando conta...'
              ) : (
                <>
                  <span>Criar Conta</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="auth-footer-text" style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            Já possui uma conta?{' '}
            <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 600 }}>Entrar na plataforma</Link>
          </p>
        </div>
      </div>
    </div>
  );
};
