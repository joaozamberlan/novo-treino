import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, Layers, Settings, Shield, ArrowRight } from 'lucide-react';

interface NavCard {
  icon: React.ElementType;
  label: string;
  description: string;
  route: string;
  variant?: 'accent' | 'danger' | 'default';
}

const baseCards: NavCard[] = [
  {
    icon: Users,
    label: 'Alunos',
    description: 'Cadastro, histórico de treinos e novas prescrições.',
    route: '/alunos',
    variant: 'accent',
  },
  {
    icon: Layers,
    label: 'Biblioteca',
    description: 'Exercícios e técnicas organizados por grupo muscular.',
    route: '/exercicios',
  },
  {
    icon: Settings,
    label: 'Configurações',
    description: 'Perfil profissional, contato e logotipo nos PDFs.',
    route: '/configuracoes',
  },
];

const adminCard: NavCard = {
  icon: Shield,
  label: 'Administração',
  description: 'Permissões e controle de acesso de profissionais.',
  route: '/admin',
  variant: 'danger',
};

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Início | TreinosApp';
  }, []);

  const cards: NavCard[] =
    user?.role === 'SUPERADMIN' ? [...baseCards, adminCard] : baseCards;

  const firstName = user?.nome?.split(' ')[0] ?? user?.nome ?? '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      <div className="stagger-1">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
          <span style={{ width: '7px', height: '7px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            PAINEL DE GESTÃO // TREINOS & PERIODIZAÇÃO
          </span>
        </div>
        <h1>Olá, {firstName}</h1>
        <p>Acompanhe seus alunos, prescreva fichas e consulte a biblioteca de exercícios.</p>
      </div>

      <div className="home-grid stagger-2">
        {cards.map((card) => {
          const Icon = card.icon;
          const iconClass =
            card.variant === 'accent'
              ? 'home-card-icon home-card-icon--accent'
              : card.variant === 'danger'
              ? 'home-card-icon home-card-icon--danger'
              : 'home-card-icon';

          return (
            <div
              key={card.route}
              className="home-card"
              onClick={() => navigate(card.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(card.route);
                }
              }}
            >
              <div className={iconClass}>
                <Icon size={18} />
              </div>

              <div className="home-card-content">
                <h3>{card.label}</h3>
                <p>{card.description}</p>
              </div>

              <ArrowRight size={15} className="home-card-arrow" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
