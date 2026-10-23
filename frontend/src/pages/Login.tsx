import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
  XIcon,
} from '@phosphor-icons/react';
import api from '../services/api';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { AcessoShell } from '../components/AcessoShell';
import { ModalPortal } from '../components/ModalPortal';

export const Login: React.FC = () => {
  const emailField = useFieldValidation('', (v) => {
    if (!v.trim()) return 'Informe seu e-mail';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'E-mail inválido';
    return null;
  });
  const senhaField = useFieldValidation('', (v) => {
    if (!v) return 'Informe sua senha';
    return null;
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  // null = ainda perguntando ao servidor se o envio de e-mail está configurado
  const [recuperacaoPorEmail, setRecuperacaoPorEmail] = useState<boolean | null>(null);
  const [emailRecuperacao, setEmailRecuperacao] = useState('');
  const [enviandoLink, setEnviandoLink] = useState(false);
  const [avisoLinkEnviado, setAvisoLinkEnviado] = useState('');
  const [erroRecuperacao, setErroRecuperacao] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  // Conta as senhas recusadas: cada uma faz o campo tremer uma vez
  const [recusas, setRecusas] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Entrar | No Game';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Force-validate all fields on submit
    const emailOk = emailField.touch();
    const senhaOk = senhaField.touch();
    if (!emailOk || !senhaOk) return;

    setError('');
    setLoading(true);

    try {
      await login(emailField.value, senhaField.value);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      // Só senha recusada treme; falha de rede não é erro de quem digitou
      if (err.response?.status === 401) setRecusas((n) => n + 1);
      setError(
        err.response?.data?.message ||
        'Credenciais inválidas. Verifique seu e-mail e senha.'
      );
    } finally {
      setLoading(false);
    }
  };

  const abrirRecuperacao = () => {
    setEmailRecuperacao(emailField.value.trim());
    setAvisoLinkEnviado('');
    setErroRecuperacao('');
    setRecuperacaoPorEmail(null);
    setShowForgotModal(true);
    // Sem resposta do servidor, vale o caminho que sempre funciona: o administrador
    api.get('/auth/recuperacao-senha')
      .then((res) => setRecuperacaoPorEmail(res.data?.disponivel === true))
      .catch(() => setRecuperacaoPorEmail(false));
  };

  const handleEnviarLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailRecuperacao.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErroRecuperacao('Informe um e-mail válido');
      return;
    }

    setErroRecuperacao('');
    setEnviandoLink(true);
    try {
      const res = await api.post('/auth/esqueci-senha', { email });
      setAvisoLinkEnviado(res.data.message);
    } catch (err: any) {
      const mensagem = err.response?.data?.message;
      setErroRecuperacao(
        (Array.isArray(mensagem) ? mensagem[0] : mensagem) ||
        'Não foi possível enviar o link. Tente de novo em instantes.'
      );
    } finally {
      setEnviandoLink(false);
    }
  };

  return (
    <>
    <AcessoShell
      titulo="Entrar"
      subtitulo="Acesse suas fichas, alunos e periodizações."
      rodape={[
        <>Ainda não tem conta? <Link to="/register">Criar conta</Link></>,
        <>É aluno? <Link to="/aluno/entrar">Entrar no meu treino</Link></>,
      ]}
    >
      <form onSubmit={handleSubmit} noValidate className="acesso-form">
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="email">E-mail</label>
          <div className="login-input-wrap">
            <input
              id="email"
              type="email"
              className={`form-input ${emailField.inputClass}`}
              placeholder="voce@exemplo.com"
              value={emailField.value}
              maxLength={254}
              onChange={emailField.onChange}
              onBlur={emailField.onBlur}
              autoComplete="email"
              spellCheck={false}
              disabled={loading}
            />
          </div>
          {emailField.error && (
            <span className="field-error" role="alert">{emailField.error}</span>
          )}
        </div>

        <div className="form-group">
          <div className="form-label-row">
            <label className="form-label" htmlFor="senha">Senha</label>
            <button type="button" onClick={abrirRecuperacao} className="link-acao">
              Esqueceu a senha?
            </button>
          </div>
          {/* A cada senha recusada o campo remonta e treme uma vez */}
          <div key={recusas} className={`login-input-wrap${recusas > 0 ? ' login-input-wrap--recusado' : ''}`}>
            <input
              id="senha"
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${senhaField.inputClass}`}
              value={senhaField.value}
              maxLength={200}
              onChange={senhaField.onChange}
              onBlur={senhaField.onBlur}
              autoComplete="current-password"
              disabled={loading}
            />
            <button
              type="button"
              className="login-toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeSlashIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
          {senhaField.error && (
            <span className="field-error" role="alert">{senhaField.error}</span>
          )}
        </div>

        <button type="submit" className="btn-login-submit" disabled={loading}>
          <span>{loading ? 'Entrando…' : 'Entrar'}</span>
          <ArrowRightIcon size={16} aria-hidden="true" />
        </button>
      </form>
    </AcessoShell>

      {/* ─── Modal: Esqueceu a Senha ─── */}
      {showForgotModal && (
        <ModalPortal>
        <div
          className="modal-backdrop"
          onClick={() => setShowForgotModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalRecuperarSenhaTitulo"
        >
          <div className="modal-content recuperar" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="modalRecuperarSenhaTitulo">Recuperar senha</h2>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowForgotModal(false)}
                aria-label="Fechar recuperação de senha"
              >
                <XIcon size={18} />
              </button>
            </div>

            {recuperacaoPorEmail === null && (
              <p className="recuperar-texto" role="status">Carregando…</p>
            )}

            {recuperacaoPorEmail === true && avisoLinkEnviado && (
              <>
                <div className="recuperar-texto" role="status">
                  <p>{avisoLinkEnviado}</p>
                  <p>O link vale por 60 minutos. Se o e-mail não chegar em alguns minutos, confira a caixa de spam.</p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={() => setShowForgotModal(false)} style={{ flex: 1 }}>
                    Voltar ao login
                  </button>
                </div>
              </>
            )}

            {recuperacaoPorEmail === true && !avisoLinkEnviado && (
              <form onSubmit={handleEnviarLink} noValidate>
                <div className="recuperar-texto">
                  <p>
                    Informe o e-mail da sua conta. Enviaremos um link para você criar uma senha nova.
                  </p>
                  <div className="form-group">
                    <label className="form-label" htmlFor="emailRecuperacao">E-mail da conta</label>
                    <input
                      id="emailRecuperacao"
                      type="email"
                      className={`form-input ${erroRecuperacao ? 'form-input--error' : ''}`}
                      placeholder="voce@exemplo.com"
                      value={emailRecuperacao}
                      maxLength={254}
                      onChange={(e) => setEmailRecuperacao(e.target.value)}
                      autoComplete="email"
                      spellCheck={false}
                      disabled={enviandoLink}
                    />
                    {erroRecuperacao && (
                      <span className="field-error" role="alert">{erroRecuperacao}</span>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowForgotModal(false)} disabled={enviandoLink}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={enviandoLink} style={{ flex: 1 }}>
                    {enviandoLink ? 'Enviando…' : 'Enviar link'}
                  </button>
                </div>
              </form>
            )}

            {recuperacaoPorEmail === false && (
              <>
                <div className="recuperar-texto">
                  <p>
                    Por segurança, quem redefine a senha é o administrador do sistema.
                  </p>
                  <ol className="recuperar-passos">
                    <li>Peça a redefinição ao <strong>administrador</strong>.</li>
                    <li>Ele gera uma <strong>senha temporária</strong> para a sua conta.</li>
                    <li>Entre com ela e crie a senha nova em <strong>Configurações, Segurança</strong>.</li>
                  </ol>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-primary" onClick={() => setShowForgotModal(false)} style={{ flex: 1 }}>
                    Voltar ao login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </ModalPortal>
      )}
    </>
  );
};
