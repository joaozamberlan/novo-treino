import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Layers, Settings, LogOut, User, Shield, Users, Menu, Home, Sun, Moon, Download, Smartphone, FlaskConical } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { canInstall, install } = usePWAInstall();
  const [showIosHint, setShowIosHint] = useState(false);
  const [isExpanded, setIsExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    return saved === 'true';
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
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

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
      )}

      {/* Top Header Bar */}
      <header className="topbar">
        <div className="topbar-left">
          <button 
            className="topbar-btn" 
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
              title="Início"
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
              title="Alunos"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
            >
              <Users size={16} />
              <span className="sidebar-label">Alunos</span>
            </NavLink>

            <NavLink 
              to="/exercicios" 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
              title="Biblioteca"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
            >
              <Layers size={16} />
              <span className="sidebar-label">Biblioteca</span>
            </NavLink>

            {user?.role === 'SUPERADMIN' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
                title="Admin"
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
              title="Configurações"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
            >
              <Settings size={16} />
              <span className="sidebar-label">Configurações</span>
            </NavLink>

            <NavLink 
              to="/prototypes/exercise-card" 
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`} 
              title="Protótipos UI"
              onClick={() => {
                if (window.innerWidth <= 768) setIsExpanded(false);
              }}
              style={{ color: 'var(--accent)' }}
            >
              <FlaskConical size={16} />
              <span className="sidebar-label">Protótipos UI</span>
            </NavLink>
          </nav>

          <div 
            className="sidebar-footer" 
            onClick={(e) => {
              e.stopPropagation();
              navigate('/configuracoes');
              if (window.innerWidth <= 768) setIsExpanded(false);
            }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
              <div className="sidebar-avatar">
                {user?.logoUrl ? (
                  <img src={user.logoUrl} alt="" />
                ) : (
                  <User size={14} />
                )}
              </div>
              <div className="sidebar-user-details">
                <span className="sidebar-user-name">{user?.nome}</span>
                <span className="sidebar-user-role">{user?.cref || 'Personal Trainer'}</span>
              </div>
            </div>
            {isExpanded && (
              <button 
                className="exercise-action-btn danger" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleLogout();
                }}
                title="Sair"
                style={{ marginLeft: '0.5rem', flexShrink: 0 }}
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </aside>

        <main className="content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
