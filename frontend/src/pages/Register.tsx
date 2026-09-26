import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Eye, EyeOff, Check, Clock, Cloud, HardDrive, Sliders } from 'lucide-react';
import { useFieldValidation } from '../hooks/useFieldValidation';

export const Register: React.FC = () => {
  const nomeField = useFieldValidation('', (v) => {
    if (!v.trim()) return 'Informe seu nome completo';
    if (v.trim().length < 3) return 'Nome deve ter pelo menos 3 caracteres';
    return null;
  });

  const emailField = useFieldValidation('', (v) => {
    if (!v.trim()) return 'Informe seu e-mail';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Informe um e-mail válido';
    return null;
  });

  const senhaField = useFieldValidation('', (v) => {
    if (!v) return 'Informe uma senha';
    if (v.length < 6) return 'A senha deve ter pelo menos 6 caracteres';
    return null;
  });

  const crefField = useFieldValidation('', (v) => {
    if (!v.trim()) return 'Informe seu registro CREF';
    if (v.trim().length > 20) return 'O CREF deve ter no máximo 20 caracteres';
    return null;
  });

  const [showPassword, setShowPassword] = useState(false);
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

    const nomeOk = nomeField.touch();
    const emailOk = emailField.touch();
    const senhaOk = senhaField.touch();
    const crefOk = crefField.touch();

    if (!nomeOk || !emailOk || !senhaOk || !crefOk) return;

    setError('');
    setLoading(true);

    try {
      await register({
        nome: nomeField.value.trim(),
        email: emailField.value.trim(),
        senha: senhaField.value,
        cref: crefField.value.trim(),
        profissao: profissao.trim() || 'Personal Trainer',
        telefone: telefone.trim() || undefined,
        instagram: instagram.trim() || undefined,
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
            TREINOS APP • PRESCRIÇÃO PROFISSIONAL
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
          <div className="login-form-eyebrow">CADASTRO PROFISSIONAL</div>
          <h2 className="login-form-title">Criar conta</h2>
          <p className="login-form-sub">Preencha seus dados para começar a prescrever treinos.</p>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="nome">Nome completo</label>
              <div className="login-input-wrap">
                <input
                  id="nome"
                  type="text"
                  className={`form-input ${nomeField.inputClass}`}
                  placeholder="Ex: Prof. João Silva"
                  value={nomeField.value}
                  maxLength={120}
                  onChange={nomeField.onChange}
                  onBlur={nomeField.onBlur}
                  autoComplete="name"
                />
              </div>
              {nomeField.error && (
                <span className="field-error" role="alert">{nomeField.error}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="email">E-mail de acesso</label>
              <div className="login-input-wrap">
                <input
                  id="email"
                  type="email"
                  className={`form-input ${emailField.inputClass}`}
                  placeholder="treinador@exemplo.com"
                  value={emailField.value}
                  maxLength={254}
                  onChange={emailField.onChange}
                  onBlur={emailField.onBlur}
                  autoComplete="email"
                />
              </div>
              {emailField.error && (
                <span className="field-error" role="alert">{emailField.error}</span>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label" htmlFor="senha">Senha</label>
              <div className="login-input-wrap">
                <input
                  id="senha"
                  type={showPassword ? 'text' : 'password'}
                  className={`form-input ${senhaField.inputClass}`}
                  placeholder="Mínimo 6 caracteres"
                  value={senhaField.value}
                  maxLength={72}
                  onChange={senhaField.onChange}
                  onBlur={senhaField.onBlur}
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
              {senhaField.error && (
                <span className="field-error" role="alert">{senhaField.error}</span>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="cref">CREF</label>
                <div className="login-input-wrap">
                  <input
                    id="cref"
                    type="text"
                    className={`form-input ${crefField.inputClass}`}
                    placeholder="000000-G/UF"
                    maxLength={20}
                    value={crefField.value}
                    onChange={crefField.onChange}
                    onBlur={crefField.onBlur}
                  />
                </div>
                {crefField.error && (
                  <span className="field-error" role="alert">{crefField.error}</span>
                )}
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
                    maxLength={80}
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
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    className="form-input"
                    placeholder="(00) 90000-0000"
                    value={telefone}
                    maxLength={30}
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
                    maxLength={100}
                    onChange={(e) => setInstagram(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-login-submit"
              disabled={loading}
            >
              {loading ? (
                'Criando conta...'
              ) : (
                <>
                  <span>Criar Conta</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-support">
            Já possui uma conta? <Link to="/login">Entrar na plataforma</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
