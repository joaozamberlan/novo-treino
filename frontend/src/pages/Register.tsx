import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const Register: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
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
    <div className="auth-wrapper animate-fade-in">
      <div className="card auth-card" style={{ maxWidth: '500px' }}>
        <div className="auth-header">
          <h1 className="auth-logo">TreinosApp</h1>
          <p>Crie sua conta de Personal Trainer</p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ display: 'block', marginBottom: '1.5rem', padding: '0.75rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="nome">Nome Completo</label>
            <input
              id="nome"
              type="text"
              className="form-control"
              placeholder="Ex: Prof. João Silva"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              className="form-control"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="form-control"
              placeholder="Mínimo 6 caracteres"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="cref">CREF</label>
              <input
                id="cref"
                type="text"
                className="form-control"
                placeholder="000000-G/UF"
                value={cref}
                onChange={(e) => setCref(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="profissao">Profissão</label>
              <input
                id="profissao"
                type="text"
                className="form-control"
                placeholder="Ex: Personal Trainer"
                value={profissao}
                onChange={(e) => setProfissao(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2" style={{ gap: '1rem', marginBottom: '2rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="telefone">Telefone (Opcional)</label>
              <input
                id="telefone"
                type="text"
                className="form-control"
                placeholder="(00) 90000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="instagram">Instagram @ (Opcional)</label>
              <input
                id="instagram"
                type="text"
                className="form-control"
                placeholder="seu.perfil"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginBottom: '1.5rem' }}
            disabled={loading}
          >
            {loading ? 'Cadastrando...' : 'Criar minha Conta'}
          </button>
        </form>

        <p style={{ fontSize: '0.9rem' }}>
          Já possui uma conta?{' '}
          <Link to="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: '600' }}>
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
};
