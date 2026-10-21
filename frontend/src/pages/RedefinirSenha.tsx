import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRightIcon, EyeIcon, EyeSlashIcon } from '@phosphor-icons/react';
import { toast } from 'sonner';
import api from '../services/api';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { useTema } from '../hooks/useTema';
import { useTopoEscuro } from '../hooks/useTopoEscuro';

// Destino do link enviado por e-mail em "Esqueceu a senha?"
export const RedefinirSenha: React.FC = () => {
  // O formulário segue o tema salvo; o painel de marca é sempre escuro
  useTema();
  useTopoEscuro();

  // Lido uma vez: logo depois o token sai da barra de endereço
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') ?? '');

  const senhaField = useFieldValidation('', (v) => {
    if (!v) return 'Informe a nova senha';
    if (v.length < 8) return 'A senha deve ter pelo menos 8 caracteres';
    return null;
  });
  const confirmarField = useFieldValidation('', (v) => {
    if (!v) return 'Repita a nova senha';
    if (v !== senhaField.value) return 'As senhas não são iguais';
    return null;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Nova senha | TreinosApp';
    // O token não fica no histórico do navegador nem em capturas de tela
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const senhaOk = senhaField.touch();
    const confirmarOk = confirmarField.touch();
    if (!senhaOk || !confirmarOk) return;

    setError('');
    setLoading(true);

    try {
      await api.post('/auth/redefinir-senha', { token, novaSenha: senhaField.value });
      toast.success('Senha redefinida. Entre com a nova senha.');
      navigate('/login', { replace: true });
    } catch (err: any) {
      const mensagem = err.response?.data?.message;
      setError(
        (Array.isArray(mensagem) ? mensagem[0] : mensagem) ||
        'Não foi possível redefinir a senha. Tente de novo em instantes.'
      );
    } finally {
      setLoading(false);
    }
  };

  const subtitulo = token
    ? 'Escolha uma senha com pelo menos 8 caracteres.'
    : 'Este link não é válido. Peça um novo em "Esqueceu a senha?".';

  return (
    <div className="login-wrapper">
      <div className="login-left-panel painel-escuro">
        <div className="login-brand-header">
          <div className="login-brand-pill">
            TREINOS APP • PRESCRIÇÃO PROFISSIONAL
          </div>
          <h1 className="login-hero-title">
            Crie uma senha nova <span>e volte a prescrever.</span>
          </h1>
          <p className="login-hero-desc">
            Ao redefinir a senha, as sessões abertas em outros aparelhos são encerradas.
          </p>

          {/* No celular o painel vira uma faixa escura e leva o título da tela */}
          <div className="login-mobile-head">
            <div className="login-form-eyebrow">ACESSO PROFISSIONAL</div>
            <h2 className="login-form-title">Nova senha</h2>
            <p className="login-form-sub">{subtitulo}</p>
          </div>
        </div>
      </div>

      <div className="login-right-panel">
        <div className="login-form-container">
          <div className="login-desktop-head">
            <div className="login-form-eyebrow">ACESSO PROFISSIONAL</div>
            <h2 className="login-form-title">Nova senha</h2>
            <p className="login-form-sub">{subtitulo}</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          {token && (
            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group" style={{ marginBottom: '1.15rem' }}>
                <label className="form-label" htmlFor="novaSenha">Nova senha</label>
                <div className="login-input-wrap">
                  <input
                    id="novaSenha"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${senhaField.inputClass}`}
                    placeholder="Mínimo 8 caracteres"
                    value={senhaField.value}
                    maxLength={72}
                    onChange={senhaField.onChange}
                    onBlur={senhaField.onBlur}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="login-toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                  >
                    {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
                  </button>
                </div>
                {senhaField.error && (
                  <span className="field-error" role="alert">{senhaField.error}</span>
                )}
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label" htmlFor="confirmarSenha">Repita a nova senha</label>
                <div className="login-input-wrap">
                  <input
                    id="confirmarSenha"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${confirmarField.inputClass}`}
                    placeholder="••••••••"
                    value={confirmarField.value}
                    maxLength={72}
                    onChange={confirmarField.onChange}
                    onBlur={confirmarField.onBlur}
                    autoComplete="new-password"
                    disabled={loading}
                  />
                </div>
                {confirmarField.error && (
                  <span className="field-error" role="alert">{confirmarField.error}</span>
                )}
              </div>

              <button
                type="submit"
                className="btn-login-submit"
                disabled={loading}
              >
                <span>{loading ? 'Salvando…' : 'Salvar nova senha'}</span>
                <ArrowRightIcon size={16} />
              </button>
            </form>
          )}

          <div className="login-footer-support">
            Lembrou a senha? <Link to="/login">Entrar na plataforma</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
