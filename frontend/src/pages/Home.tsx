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
        <span style={{ fontSize: '0.75rem', color: 'var(--text-1)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          Painel de Controle
        </span>
        <h1 style={{ marginTop: '0.2rem' }}>Olá, {user?.nome}</h1>
        <p>Selecione um módulo para começar a trabalhar.</p>
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Acesse seus alunos cadastrados, adicione novos e prescreva treinos.</p>
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Gerencie o catálogo completo de exercícios, grupos musculares e técnicas de treino.</p>
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Ajuste seus dados de perfil profissional, contatos e o logotipo impresso nos PDFs.</p>
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
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.2rem' }}>Painel Admin</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-1)' }}>Gerencie profissionais cadastrados, aprove ou suspenda contas de usuários.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
