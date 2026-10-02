import React, { useState, useEffect } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PageTransition } from './PageTransition';
import { PressScale } from './PressScale';
import { useAuth } from '../contexts/AuthContext';
import { 
  Settings, LogOut, User, Shield, Users, Menu, Home, 
  Sun, Moon, Download, Smartphone, ChevronDown, Dumbbell
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ModalPortal } from './ModalPortal';

// Abas da Biblioteca: as três ficam na mesma rota e mudam pelo ?tab=
const SUBITENS_BIBLIOTECA = [
  { tab: 'exercicios', rotulo: 'Exercícios' },
  { tab: 'grupos', rotulo: 'Grupos Musculares' },
  { tab: 'tecnicas', rotulo: 'Técnicas de Treino' },
];

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get('tab');
  const isExerciciosRoute = location.pathname.startsWith('/exercicios');

  const { canInstall, install } = usePWAInstall();
  const [showIosHint, setShowIosHint] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(() => isExerciciosRoute);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    // Default expanded on desktop (≥1024px) unless user explicitly collapsed it
    if (saved !== null) return saved === 'true';
    return window.innerWidth >= 1024;
  });
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  // Detecta iOS (Safari não suporta beforeinstallprompt)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = (window.navigator as any).standalone === true;
  const showIosInstall = isIos && !isStandalone;

  // Toggle theme class on body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'light' ? '#f4f3ef' : '#0f0f0f');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // Auto-expand library submenu when on exercicios route
  useEffect(() => {
    if (isExerciciosRoute) {
      setIsLibraryOpen(true);
    }
  }, [isExerciciosRoute]);

  // Track screen size to auto-collapse on small screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setIsExpanded(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(prev => {
      const next = !prev;
      localStorage.setItem('sidebar-expanded', String(next));
      return next;
    });
  };

  const handleSidebarClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
      localStorage.setItem('sidebar-expanded', 'true');
    }
  };

  return (
    <div className="app-shell">
      {/* iOS install hint */}
      {showIosHint && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={() => setShowIosHint(false)}
          >
            <div
              className="modal-content"
              onClick={e => e.stopPropagation()}
              style={{ textAlign: 'center' }}
            >
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '12px', 
                backgroundColor: 'var(--accent-dim)', 
                color: 'var(--accent)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <Smartphone size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Instalar TreinosApp</h3>
              <p style={{ color: 'var(--text-1)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Toque em <strong>⎋ Compartilhar</strong> na barra do Safari e depois em{' '}
                <strong>"Adicionar à Tela de Início"</strong>
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowIosHint(false)}
                style={{ width: '100%' }}
              >
                Entendido
              </button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Top Header Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button
            className="topbar-btn menu-toggle-btn"
            onClick={toggleSidebar}
            title={isExpanded ? "Recolher menu" : "Expandir menu"}
            aria-label={isExpanded ? "Recolher menu lateral" : "Expandir menu lateral"}
            style={{ marginRight: '0.25rem' }}
          >
            <Menu size={18} aria-hidden="true" />
          </button>
          <NavLink to="/" className="topbar-brand" aria-label="TreinosApp - Página Inicial">
            <BrandLogo size={22} text="Treinos" />
          </NavLink>
        </div>

        <div className="topbar-right">
          {/* Botão instalar PWA — Android/Chrome */}
          {canInstall && (
            <button
              className="topbar-btn"
              onClick={install}
              title="Instalar app"
              aria-label="Instalar aplicativo no dispositivo"
              style={{ color: 'var(--accent)' }}
            >
              <Download size={18} aria-hidden="true" />
            </button>
          )}
          {/* Botão instalar PWA — iOS (instrução manual) */}
          {showIosInstall && !canInstall && (
            <button
              className="topbar-btn"
              onClick={() => setShowIosHint(true)}
              title="Instalar app no iPhone"
              aria-label="Instruções para instalar no iPhone"
              style={{ color: 'var(--accent)' }}
            >
              <Download size={18} aria-hidden="true" />
            </button>
          )}
          <button 
            className="topbar-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? "Ativar modo claro" : "Ativar modo escuro"}
            aria-label={theme === 'dark' ? "Alternar para modo claro" : "Alternar para modo escuro"}
          >
            {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
          </button>
          <div className="topbar-divider" aria-hidden="true" />
          <button 
            className="topbar-btn" 
            onClick={handleLogout} 
            title="Sair"
            aria-label="Sair da conta"
          >
            <LogOut size={18} aria-hidden="true" />
          </button>
        </div>
      </header>


      {/* Main Layout containing Sidebar and Page Content */}
      <div className="main-layout">
        {/* Backdrop for mobile drawer */}
        {isExpanded && (
          <div 
            className="sidebar-backdrop-mobile"
            onClick={() => setIsExpanded(false)}
            aria-hidden="true"
          />
        )}
        <aside 
          className={`app-sidebar ${isExpanded ? 'expanded' : ''}`}
          onClick={handleSidebarClick}
          style={{ cursor: isExpanded ? 'default' : 'pointer' }}
        >
          <nav className="sidebar-nav">
            <NavLink 
              to="/" 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
              data-tooltip="Início"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
              end
            >
              <Home size={16} />
              <span className="sidebar-label">Início</span>
            </NavLink>

            <NavLink 
              to="/alunos" 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
              data-tooltip="Alunos"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
            >
              <Users size={16} />
              <span className="sidebar-label">Alunos</span>
            </NavLink>

            {/* Biblioteca com Dropdown */}
            <div className="sidebar-group">
              <button 
                type="button"
                // Com o grupo aberto quem fica marcado é o subitem da página;
                // fechado (ou com a barra recolhida), o próprio grupo.
                className={`sidebar-item sidebar-item-header ${
                  isExerciciosRoute ? (isExpanded && isLibraryOpen ? 'ancestral' : 'active') : ''
                }`}
                data-tooltip="Biblioteca"
                aria-expanded={isExpanded && isLibraryOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isExpanded) {
                    setIsExpanded(true);
                    localStorage.setItem('sidebar-expanded', 'true');
                    setIsLibraryOpen(true);
                  } else {
                    setIsLibraryOpen(prev => !prev);
                  }
                }}
              >
                <Dumbbell size={16} />
                <span className="sidebar-label">Biblioteca</span>
                <ChevronDown 
                  size={14} 
                  className="sidebar-chevron"
                  style={{ 
                    transform: isLibraryOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 180ms var(--ease)' 
                  }} 
                />
              </button>

              {/* Link, e não NavLink: as três abas moram na mesma rota (/exercicios),
                  e o NavLink marcaria as três como ativas ao mesmo tempo. */}
              {isLibraryOpen && (
                <div className="sidebar-submenu">
                  {SUBITENS_BIBLIOTECA.map(({ tab, rotulo }) => {
                    const ativo = isExerciciosRoute && (currentTab ?? 'exercicios') === tab;
                    return (
                      <Link
                        key={tab}
                        to={`/exercicios?tab=${tab}`}
                        className={`sidebar-subitem ${ativo ? 'active' : ''}`}
                        aria-current={ativo ? 'page' : undefined}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.innerWidth <= 768) setIsExpanded(false);
                        }}
                      >
                        {rotulo}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {user?.role === 'SUPERADMIN' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
                data-tooltip="Administração"
                onClick={() => {
                  if (window.innerWidth <= 768) setIsExpanded(false);
                }}
              >
                <Shield size={16} />
                <span className="sidebar-label">Administração</span>
              </NavLink>
            )}

            <NavLink 
              to="/configuracoes" 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
              data-tooltip="Configurações"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
            >
              <Settings size={16} />
              <span className="sidebar-label">Configurações</span>
            </NavLink>
          </nav>

          {/* O cartão do usuário leva às configurações; Sair é um botão à parte */}
          <div className="sidebar-footer">
            <Link
              to="/configuracoes"
              className="sidebar-user"
              aria-label={`${user?.nome ?? 'Minha conta'}: abrir configurações`}
              title={user?.nome}
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
            >
              <div className="sidebar-avatar">
                {user?.logoUrl ? (
                  <img src={user.logoUrl} alt="" width={32} height={32} />
                ) : (
                  <User size={15} aria-hidden="true" />
                )}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user?.nome}</span>
                <span className="sidebar-user-role">{user?.cref || 'Personal Trainer'}</span>
              </div>
            </Link>
            {isExpanded && (
              <button
                type="button"
                className="sidebar-sair"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                title="Sair"
                aria-label="Sair da conta"
              >
                <LogOut size={16} aria-hidden="true" />
              </button>
            )}
          </div>
        </aside>

        <main className="content-area">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>
      </div>

      {/* iOS Tab Bar — subtle press feedback via PressScale (high-frequency nav, kept restrained) */}
      <nav className="mobile-tab-bar" aria-label="Navegação principal">
        <NavLink to="/" end className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <Home size={22} aria-hidden="true" />
            <span>Início</span>
          </PressScale>
        </NavLink>
        <NavLink to="/alunos" className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <Users size={22} aria-hidden="true" />
            <span>Alunos</span>
          </PressScale>
        </NavLink>
        <NavLink to="/exercicios?tab=exercicios" className={`tab-bar-item ${isExerciciosRoute ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <Dumbbell size={22} aria-hidden="true" />
            <span>Biblioteca</span>
          </PressScale>
        </NavLink>
        <NavLink to="/configuracoes" className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <Settings size={22} aria-hidden="true" />
            <span>Config.</span>
          </PressScale>
        </NavLink>
      </nav>
    </div>
  );
};
