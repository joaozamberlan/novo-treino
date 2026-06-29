import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Save, Upload, ExternalLink, Dumbbell } from 'lucide-react';

export const Configuracoes: React.FC = () => {
  const { user, updateUser } = useAuth();

  // Profile form
  const [nome, setNome] = useState('');
  const [cref, setCref] = useState('');
  const [profissao, setProfissao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instagram, setInstagram] = useState('');

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
      });

      updateUser(response.data);
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erro ao salvar alterações.',
      });
    } finally {
      setSaving(false);
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
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erro ao carregar o arquivo do logotipo.',
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSeedCatalog = async () => {
    setSeeding(true);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/exercicios/seed');
      setMessage({ type: 'success', text: 'Biblioteca de exercícios semeada com sucesso!' });
      await fetchStats();
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erro ao semear biblioteca.',
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-in" style={{ display: 'flex', justifyContent: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Carregando configurações...
      </div>
    );
  }

  return (
    <div className="animate-in">
      <h1 style={{ marginBottom: '1.5rem' }}>Configurações</h1>

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
        <div className="settings-group-title">PERFIL PROFISSIONAL</div>
        <form onSubmit={handleSaveProfile}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="nomeProf">Nome de Exibição</label>
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
                value={cref}
                onChange={(e) => setCref(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="profissaoProf">Profissão / Cargo</label>
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
            <div className="form-group" style={{ maxWidth: '400px' }}>
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

          <button
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={saving}
            style={{ marginTop: '0.5rem' }}
          >
            <Save size={14} />
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        </form>
      </div>

      {/* Group 2: Visual Identity */}
      <div className="settings-group">
        <div className="settings-group-title">IDENTIDADE VISUAL (PDF)</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
          Estas informações aparecerão no cabeçalho das fichas impressas.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {logoUrl && (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--card-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              flexShrink: 0,
            }}>
              <img
                src={logoUrl}
                alt="Logo atual"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
          )}

          <div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="form-input"
              onChange={handleLogoUpload}
              disabled={uploadingLogo}
              style={{ padding: '0.4rem 0.75rem', height: 'auto' }}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              {uploadingLogo ? (
                <span><Upload size={12} style={{ verticalAlign: 'middle', marginRight: '0.25rem' }} />Enviando arquivo...</span>
              ) : (
                'Escolha um arquivo PNG ou JPG'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Group 3: Exercise Library */}
      <div className="settings-group">
        <div className="settings-group-title">BIBLIOTECA DE EXERCÍCIOS</div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.875rem' }}>
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
              <span>{seeding ? 'Gerando...' : 'Gerar Catálogo Padrão'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
