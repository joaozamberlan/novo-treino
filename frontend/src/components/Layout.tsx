import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Dumbbell, Settings, LogOut, User, Shield, Users, Menu, Home, Sun, Moon, Download } from 'lucide-react';
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
    return localStorage.getItem('theme') || 'dark';
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
          onClick={() => setShowIosHint(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center', padding: '1rem',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: '1rem', padding: '1.5rem', maxWidth: '360px',
              width: '100%', textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📲</div>
            <h3 style={{ marginBottom: '0.5rem' }}>Instalar TreinosApp</h3>
            <p style={{ color: 'var(--text-1)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Toque em <strong>⎋ Compartilhar</strong> na barra do Safari e depois em{' '}
              <strong>"Adicionar à Tela de Início"</strong>
            </p>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowIosHint(false)}
              style={{ marginTop: '1rem', width: '100%' }}
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
            style={{ marginRight: '0.25rem' }}
          >
            <Menu size={16} />
          </button>
          <NavLink to="/" className="topbar-brand">
            <Dumbbell size={18} />
            <span>TreinosApp</span>
          </NavLink>
        </div>

        <div className="topbar-right">
          {/* Botão instalar PWA — Android/Chrome */}
          {canInstall && (
            <button
              className="topbar-btn"
              onClick={install}
              title="Instalar app"
              style={{ color: 'var(--accent)' }}
            >
              <Download size={16} />
            </button>
          )}
          {/* Botão instalar PWA — iOS (instrução manual) */}
          {showIosInstall && !canInstall && (
            <button
              className="topbar-btn"
              onClick={() => setShowIosHint(true)}
              title="Instalar app no iPhone"
              style={{ color: 'var(--accent)' }}
            >
              <Download size={16} />
            </button>
          )}
          <button 
            className="topbar-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? "Ativar modo claro" : "Ativar modo escuro"}
            style={{ marginRight: '0.25rem' }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="topbar-btn" onClick={handleLogout} title="Sair">
            <LogOut size={16} />
          </button>
        </div>
      </header>


      {/* Main Layout containing Sidebar and Page Content */}
      <div className="main-layout">
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
              <Dumbbell size={16} />
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
