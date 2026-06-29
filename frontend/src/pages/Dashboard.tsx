import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Shield, Phone, Save, Award, Users, Dumbbell } from 'lucide-react';

const Instagram: React.FC<any> = (props) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    stroke="currentColor"
    strokeWidth="2"
    fill="none"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline-block', verticalAlign: 'middle', ...props.style }}
    {...props}
  >
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

export const Dashboard: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  // Profile update states
  const [nome, setNome] = useState('');
  const [cref, setCref] = useState('');
  const [profissao, setProfissao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [instagram, setInstagram] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  const [alunosCount, setAlunosCount] = useState(0);
  const [exerciciosCount, setExerciciosCount] = useState(0);
  const [tecnicasCount, setTecnicasCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      // Update local auth context info
      if (user) {
        updateUser({ ...user, logoUrl: newLogoUrl });
      }

      setMessage({ type: 'success', text: 'Logotipo carregado com sucesso!' });
    } catch (err: any) {
      console.error(err);
      setMessage({
        type: 'danger',
        text: err.response?.data?.message || 'Erro ao carregar o arquivo do logotipo.'
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/alunos');
      setAlunosCount(response.data.length);

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
        text: err.response?.data?.message || 'Erro ao semear biblioteca.' 
      });
    } finally {
      setSeeding(false);
    }
  };

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
        text: err.response?.data?.message || 'Erro ao salvar alterações.' 
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>Carregando dados do painel...</div>;
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1>Olá, {user?.nome}</h1>
        <p>Bem-vindo ao seu painel administrativo do TreinosApp.</p>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2">
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(204, 255, 0, 0.1)', color: 'var(--accent)' }}>
            <Users size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Alunos Cadastrados</div>
            <div style={{ fontSize: '2rem', fontWeight: '800' }}>{alunosCount}</div>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ padding: '1rem', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-primary)' }}>
            <Award size={32} />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Especialidade</div>
            <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{user?.profissao}</div>
          </div>
        </div>
      </div>

      {/* Configuração da Marca (White Label) */}
      <div className="card">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={20} style={{ color: 'var(--accent)' }} />
          Branding & Identidade Visual
        </h2>
        <p style={{ marginBottom: '2rem' }}>
          Configure os dados que serão mostrados nos cabeçalhos das fichas de treino (PDFs) gerados para seus alunos.
        </p>

        {message.text && (
          <div 
            className={`badge badge-${message.type}`} 
            style={{ display: 'block', marginBottom: '1.5rem', padding: '0.75rem', textAlign: 'center' }}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label" htmlFor="nomeProf">Nome de Exibição</label>
              <input
                id="nomeProf"
                type="text"
                className="form-control"
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
                className="form-control"
                value={cref}
                onChange={(e) => setCref(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label" htmlFor="profissaoProf">Profissão / Cargo</label>
              <input
                id="profissaoProf"
                type="text"
                className="form-control"
                value={profissao}
                onChange={(e) => setProfissao(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label className="form-label">Arquivo de Logotipo (PNG/JPG)</label>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                {logoUrl && (
                  <div style={{ 
                    width: '60px', 
                    height: '60px', 
                    borderRadius: '8px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    border: '1px solid var(--card-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    <img src={logoUrl} alt="Logo Atual" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                )}
                
                <div style={{ flex: 1, minWidth: '150px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    className="form-control"
                    onChange={handleLogoFileChange}
                    disabled={uploadingLogo}
                    style={{ padding: '0.4rem 0.75rem', height: 'auto' }}
                  />
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                    {uploadingLogo ? 'Enviando arquivo...' : 'Escolha uma imagem para usar de logotipo no cabeçalho das fichas.'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label className="form-label" htmlFor="telProf">
                <Phone size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Telefone de Contato
              </label>
              <input
                id="telProf"
                type="text"
                className="form-control"
                placeholder="(00) 90000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="igProf">
                <Instagram size={14} style={{ marginRight: '0.25rem', verticalAlign: 'middle' }} />
                Perfil do Instagram
              </label>
              <input
                id="igProf"
                type="text"
                className="form-control"
                placeholder="Ex: @seuusername"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ alignSelf: 'flex-end', minWidth: '200px' }}
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>
      </div>

      {/* Catálogo de Exercícios Card */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Dumbbell size={20} style={{ color: 'var(--accent)' }} />
          Catálogo & Biblioteca de Exercícios
        </h2>
        <p>
          Para prescrever treinos para seus alunos, o sistema precisa de um catálogo básico de exercícios e técnicas. Você pode inicializá-los ou recarregá-los a qualquer momento abaixo.
        </p>

        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '12px', width: '100%', border: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status do Catálogo</div>
            <div style={{ fontWeight: '700', fontSize: '1.05rem', marginTop: '0.25rem' }}>
              {exerciciosCount > 0 ? (
                <span style={{ color: 'var(--success)' }}>
                  Biblioteca ativa com {exerciciosCount} exercícios e {tecnicasCount} técnicas de treino cadastrados.
                </span>
              ) : (
                <span style={{ color: 'var(--danger)' }}>
                  Catálogo vazio. Não será possível prescrever exercícios nas fichas.
                </span>
              )}
            </div>
          </div>
          
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleSeedCatalog}
            disabled={seeding}
            style={{ minWidth: '220px' }}
          >
            <Dumbbell size={16} />
            {seeding ? 'Carregando...' : (exerciciosCount > 0 ? 'Recarregar Catálogo Padrão' : 'Gerar Catálogo Padrão')}
          </button>
        </div>
      </div>
    </div>
  );
};
