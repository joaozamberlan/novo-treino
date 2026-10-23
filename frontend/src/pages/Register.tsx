import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowRightIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@phosphor-icons/react';
import { useFieldValidation } from '../hooks/useFieldValidation';
import { AcessoShell } from '../components/AcessoShell';

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
    document.title = 'Cadastrar | No Game';
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
    <AcessoShell
      titulo="Criar conta"
      subtitulo="Monte fichas, envie o link para cada aluno e acompanhe as cargas registradas."
      largo
      rodape={[<>Já tem conta? <Link to="/login">Entrar</Link></>]}
    >
      <form onSubmit={handleSubmit} noValidate className="acesso-form">
        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <div className="form-group">
          <label className="form-label" htmlFor="nome">Nome completo</label>
          <div className="login-input-wrap">
            <input
              id="nome"
              type="text"
              className={`form-input ${nomeField.inputClass}`}
              value={nomeField.value}
              maxLength={120}
              onChange={nomeField.onChange}
              onBlur={nomeField.onBlur}
              autoComplete="name"
              disabled={loading}
            />
          </div>
          {nomeField.error && (
            <span className="field-error" role="alert">{nomeField.error}</span>
          )}
        </div>

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
          <label className="form-label" htmlFor="senha">Senha</label>
          <div className="login-input-wrap">
            <input
              id="senha"
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${senhaField.inputClass}`}
              value={senhaField.value}
              maxLength={72}
              onChange={senhaField.onChange}
              onBlur={senhaField.onBlur}
              autoComplete="new-password"
              aria-describedby={senhaField.error ? undefined : 'senha-dica'}
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
          {senhaField.error ? (
            <span className="field-error" role="alert">{senhaField.error}</span>
          ) : (
            <span className="field-hint" id="senha-dica">Pelo menos 6 caracteres.</span>
          )}
        </div>

        {/* Dados do perfil: saem no cabeçalho da ficha em PDF */}
        <fieldset className="acesso-grupo" disabled={loading}>
          <legend className="acesso-grupo-titulo">
            Perfil na ficha
            <span>Aparece no cabeçalho do PDF. Dá para mudar depois em Configurações.</span>
          </legend>

          <div className="acesso-grade">
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
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="cref">
                CREF <span className="form-label-opcional">opcional</span>
              </label>
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
                  spellCheck={false}
                />
              </div>
              {crefField.error && (
                <span className="field-error" role="alert">{crefField.error}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefone">
                WhatsApp <span className="form-label-opcional">opcional</span>
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
                Instagram <span className="form-label-opcional">opcional</span>
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
                  spellCheck={false}
                  autoCapitalize="none"
                />
              </div>
            </div>
          </div>
        </fieldset>

        <button type="submit" className="btn-login-submit" disabled={loading}>
          <span>{loading ? 'Criando conta…' : 'Criar conta'}</span>
          <ArrowRightIcon size={16} aria-hidden="true" />
        </button>
      </form>
    </AcessoShell>
  );
};
