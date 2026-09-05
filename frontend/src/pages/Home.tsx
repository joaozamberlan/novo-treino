import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Dumbbell, Settings, Shield } from 'lucide-react';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Início | TreinosApp';
  }, []);

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1>Olá, {user?.nome}</h1>
        <p>Acompanhe seus alunos, prescreva fichas e consulte a biblioteca de exercícios.</p>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '1rem', marginTop: '0.5rem' }}>
        {/* Alunos Card */}
        <div 
          className="card card-clickable" 
          onClick={() => navigate('/alunos')}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)' }}>
            <Users size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>Alunos</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Cadastro de alunos, histórico de treinos e novas prescrições.</p>
          </div>
        </div>

        {/* Biblioteca Card */}
        <div 
          className="card card-clickable" 
          onClick={() => navigate('/exercicios')}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-0)', border: '1px solid var(--border)' }}>
            <Dumbbell size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>Biblioteca</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Exercícios e técnicas de treino organizados por grupos musculares.</p>
          </div>
        </div>

        {/* Configurações Card */}
        <div 
          className="card card-clickable" 
          onClick={() => navigate('/configuracoes')}
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'var(--bg-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-0)', border: '1px solid var(--border)' }}>
            <Settings size={18} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>Configurações</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Perfil profissional, dados de contato e logotipo impresso nos PDFs.</p>
          </div>
        </div>

        {/* Admin Card */}
        {user?.role === 'SUPERADMIN' && (
          <div 
            className="card card-clickable" 
            onClick={() => navigate('/admin')}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '6px', backgroundColor: 'rgba(240,68,56,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
              <Shield size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>Administração</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Permissões e controle de acesso para profissionais cadastrados.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
