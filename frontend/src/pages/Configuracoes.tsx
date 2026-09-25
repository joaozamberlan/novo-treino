import React, { useEffect, useState, useCallback } from 'react';
import { RODAPE_SUGERIDO } from '../utils/rodape';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Save, Upload, ExternalLink, Dumbbell, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { useFieldValidation } from '../hooks/useFieldValidation';

export const Configuracoes: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Profile form
  const [nome, setNome] = useState('');
  const [cref, setCref] = useState('');
  const [profissao, setProfissao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [rodapeTreino, setRodapeTreino] = useState('');

  // Password form — inline validation
  const novaSenhaField = useFieldValidation('', (v) => {
    if (!v) return 'Informe a nova senha';
    if (v.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
    return null;
  });
  const confirmarSenhaField = useFieldValidation('', useCallback((v: string) => {
    if (!v) return 'Confirme a nova senha';
    if (v !== novaSenhaField.value) return 'As senhas não conferem';
    return null;
  }, [novaSenhaField.value]));

  const [senhaAtual, setSenhaAtual] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  // Logo
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Stats
  const [exerciciosCount, setExerciciosCount] = useState(0);
  const [tecnicasCount, setTecnicasCount] = useState(0);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchStats = async () => {
    try {
      const exerciciosRes = await api.get('/exercicios');
      setExerciciosCount(exerciciosRes.data.length);

      const tecnicasRes = await api.get('/exercicios/tecnicas');
      setTecnicasCount(tecnicasRes.data.length);
    } catch (err) {
      console.error('Erro ao buscar estatísticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Configurações | TreinosApp';
    if (user) {
      setNome(user.nome);
      setCref(user.cref);
      setProfissao(user.profissao);
      setTelefone(user.telefone || '');
      setInstagram(user.instagram || '');
      setRodapeTreino(user.rodapeTreino || '');
      setLogoUrl(user.logoUrl || '');
    }

    fetchStats();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.patch('/profissionais/me', {
        nome,
        cref,
        profissao,
        telefone: telefone || null,
        instagram: instagram || null,
        logoUrl: logoUrl || null,
        rodapeTreino: rodapeTreino.trim() || null,
      });

      updateUser(response.data);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      const errText = err.response?.data?.message || 'Erro ao salvar alterações.';
      setMessage({ type: 'danger', text: errText });
      toast.error(errText);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    // Force-validate inline before sending to API
    const novaOk = novaSenhaField.touch();
    const confirmarOk = confirmarSenhaField.touch();
    if (!senhaAtual) { toast.error('Informe sua senha atual'); return; }
    if (!novaOk || !confirmarOk) return;

    setSavingPassword(true);
    try {
      await api.patch('/profissionais/me/senha', {
        senhaAtual,
        novaSenha: novaSenhaField.value,
      });
      toast.success('Senha atualizada com sucesso!');
      setSenhaAtual('');
      novaSenhaField.reset();
      confirmarSenhaField.reset();
    } catch (err: any) {
      console.error(err);
      const errText = err.response?.data?.message || 'Erro ao alterar senha. Verifique sua senha atual.';
      toast.error(errText);
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await api.post('/profissionais/me/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const newLogoUrl = response.data.logoUrl;
      setLogoUrl(newLogoUrl);

      if (user) {
        updateUser({ ...user, logoUrl: newLogoUrl });
      }

      setMessage({ type: 'success', text: 'Logotipo carregado com sucesso!' });
      toast.success('Logotipo carregado com sucesso!');
    } catch (err: any) {
      console.error(err);
      const errText = err.response?.data?.message || 'Erro ao carregar o arquivo do logotipo.';
      setMessage({ type: 'danger', text: errText });
      toast.error(errText);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSeedCatalog = async () => {
    setSeeding(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/exercicios/seed');
      setMessage({ type: 'success', text: 'Exercícios padrão carregados com sucesso!' });
      toast.success('Exercícios padrão carregados com sucesso!');
      await fetchStats();
    } catch (err: any) {
      console.error(err);
      const errText = err.response?.data?.message || 'Erro ao carregar exercícios padrão.';
      setMessage({ type: 'danger', text: errText });
      toast.error(errText);
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-1)' }}>
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="animate-in settings-page">
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.25rem' }}>
          <span style={{ width: '7px', height: '7px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            CONTA // PERFIL E SEGURANÇA
          </span>
        </div>
        <h1 style={{ margin: 0 }}>Configurações</h1>
      </div>

      {/* Inline message */}
      {message.text && (
        <div
          className={`badge badge-${message.type}`}
          style={{ display: 'block', padding: '0.75rem', textAlign: 'center', marginBottom: '1rem' }}
        >
          {message.text}
        </div>
      )}

      {/* Group 1: Professional Profile */}
      <div className="settings-group">
        <div className="settings-group-title">Perfil profissional</div>
        <form onSubmit={handleSaveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="nomeProf">Nome de exibição</label>
              <input
                id="nomeProf"
                type="text"
                className="form-input"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="crefProf">CREF</label>
              <input
                id="crefProf"
                type="text"
                className="form-input"
                maxLength={20}
                value={cref}
                onChange={(e) => setCref(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="profissaoProf">Profissão ou cargo</label>
              <input
                id="profissaoProf"
                type="text"
                className="form-input"
                value={profissao}
                onChange={(e) => setProfissao(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="telProf">Telefone</label>
              <input
                id="telProf"
                type="text"
                className="form-input"
                placeholder="(00) 90000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="igProf">Instagram</label>
              <input
                id="igProf"
                type="text"
                className="form-input"
                placeholder="@seuusuario"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="rodapeProf">Rodapé dos treinos (link público e PDF)</label>
            <textarea
              id="rodapeProf"
              className="form-input"
              rows={5}
              maxLength={1000}
              placeholder="Deixe em branco para não exibir rodapé. Separe parágrafos com uma linha em branco."
              value={rodapeTreino}
              onChange={(e) => setRodapeTreino(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.4rem' }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRodapeTreino(RODAPE_SUGERIDO)}>
                Usar texto sugerido
              </button>
              {rodapeTreino && (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setRodapeTreino('')}>
                  Limpar
                </button>
              )}
            </div>
            <p className="settings-desc" style={{ marginTop: '0.4rem' }}>
              Aparece no fim de cada treino. Dá para abrir exceção em uma ficha específica, ao editar a ficha dentro da periodização.
            </p>
          </div>

          <div className="settings-actions">
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={saving}
            >
              <Save size={14} />
              <span>{saving ? 'Salvando...' : 'Salvar alterações'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Group 2: Visual Identity */}
      <div className="settings-group">
        <div className="settings-group-title">Identidade visual (PDF e Compartilhamento)</div>
        <p className="settings-desc">
          Estas informações aparecem no cabeçalho do PDF e nos links compartilhados com os alunos.
        </p>

        <div className="logo-upload">
          <div className="logo-upload-preview">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo atual" />
            ) : (
              <span>Sem logo</span>
            )}
          </div>

          <div className="logo-upload-body">
            <label className={`btn btn-secondary btn-sm logo-upload-btn${uploadingLogo ? ' is-disabled' : ''}`}>
              <Upload size={14} />
              <span>{uploadingLogo ? 'Enviando...' : logoUrl ? 'Trocar logo' : 'Enviar logo'}</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleLogoUpload}
                disabled={uploadingLogo}
                className="visually-hidden"
              />
            </label>
            <div className="settings-hint">PNG ou JPG. Aparece no cabeçalho do PDF e nos links dos alunos.</div>
          </div>
        </div>
      </div>

      {/* Group 3: Exercise Library */}
      <div className="settings-group">
        <div className="settings-group-title">Biblioteca de exercícios</div>
        <p className="settings-desc">
          {exerciciosCount} exercícios · {tecnicasCount} técnicas cadastradas
        </p>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link to="/exercicios" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            <span>Gerenciar Biblioteca</span>
          </Link>

          {exerciciosCount === 0 && (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={handleSeedCatalog}
              disabled={seeding}
            >
              <Dumbbell size={14} />
              <span>{seeding ? 'Carregando...' : 'Carregar Exercícios Padrão'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Group 4: Security & Password */}
      <div className="settings-group">
        <div className="settings-group-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Lock size={15} color="var(--accent)" />
          <span>Segurança e Senha de Acesso</span>
        </div>
        <p className="settings-desc">
          Altere sua senha de acesso à plataforma. Caso tenha recebido uma senha temporária da administração, cadastre sua senha definitiva pessoal abaixo.
        </p>

        <form onSubmit={handleChangePassword} style={{ maxWidth: '540px' }}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" htmlFor="senhaAtual">Senha atual ou temporária</label>
            <div className="login-input-wrap">
              <input
                id="senhaAtual"
                type={showSenhaAtual ? 'text' : 'password'}
                className="form-input"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
                placeholder="Informe sua senha atual"
                required
              />
              <button
                type="button"
                className="login-toggle-password"
                onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                title={showSenhaAtual ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showSenhaAtual ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="form-row" style={{ marginBottom: '0.5rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="novaSenha">Nova senha</label>
              <div className="login-input-wrap">
                <input
                  id="novaSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  className={`form-input ${novaSenhaField.inputClass}`}
                  value={novaSenhaField.value}
                  onChange={novaSenhaField.onChange}
                  onBlur={novaSenhaField.onBlur}
                  placeholder="Mínimo 8 caracteres"
                />
                <button
                  type="button"
                  className="login-toggle-password"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  title={showNovaSenha ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showNovaSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {novaSenhaField.error && (
                <span className="field-error" role="alert">{novaSenhaField.error}</span>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmarSenha">Confirmar nova senha</label>
              <div className="login-input-wrap">
                <input
                  id="confirmarSenha"
                  type={showNovaSenha ? 'text' : 'password'}
                  className={`form-input ${confirmarSenhaField.inputClass}`}
                  value={confirmarSenhaField.value}
                  onChange={confirmarSenhaField.onChange}
                  onBlur={confirmarSenhaField.onBlur}
                  placeholder="Repita a nova senha"
                />
              </div>
              {confirmarSenhaField.error && (
                <span className="field-error" role="alert">{confirmarSenhaField.error}</span>
              )}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={savingPassword}
            style={{ marginTop: '0.75rem' }}
          >
            <Lock size={14} />
            <span>{savingPassword ? 'Atualizando...' : 'Atualizar Senha'}</span>
          </button>
        </form>
      </div>

      {/* Group 5: Admin (SuperAdmin only) */}
      {user?.role === 'SUPERADMIN' && (
        <div className="settings-group">
          <div className="settings-group-title" style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Shield size={15} color="var(--accent)" />
            <span>Administração</span>
          </div>
          <p className="settings-desc">
            Gerencie contas de treinadores, aprovações de acesso e permissões de SuperAdmin.
          </p>
          <Link to="/admin" className="btn btn-secondary btn-sm">
            <ExternalLink size={14} />
            <span>Abrir Painel Admin</span>
          </Link>
        </div>
      )}
    </div>
  );
};
