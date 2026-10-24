import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { PageTransition } from './PageTransition';
import { PressScale } from './PressScale';
import { useAuth } from '../contexts/AuthContext';
import {
  BarbellIcon,
  DeviceMobileIcon,
  DownloadSimpleIcon,
  GearIcon,
  HouseIcon,
  MagnifyingGlassIcon,
  MoonIcon,
  ShieldIcon,
  SignOutIcon,
  SunIcon,
  UsersIcon,
  XIcon,
} from '@phosphor-icons/react';
import { BrandLogo } from './BrandLogo';
import { CampoBusca } from './CampoBusca';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { ModalPortal } from './ModalPortal';
import api from '../services/api';
import { memoryCache } from '../services/cache';

// O que a busca da barra precisa de cada aluno; a lista vem do mesmo cache
// ('alunos') que a tela de Alunos preenche
interface AlunoBusca {
  idAluno: number;
  nome: string;
}

const ID_BUSCA = 'busca-aluno-topo';

// Foco num campo de texto: o "/" é do texto, não atalho
const digitandoEm = (el: Element | null) =>
  el instanceof HTMLInputElement ||
  el instanceof HTMLTextAreaElement ||
  el instanceof HTMLSelectElement ||
  (el instanceof HTMLElement && el.isContentEditable);

export const Layout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isExerciciosRoute = location.pathname.startsWith('/exercicios');

  const { canInstall, install } = usePWAInstall();
  const [showIosHint, setShowIosHint] = useState(false);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });

  const [alunosBusca, setAlunosBusca] = useState<AlunoBusca[]>(() => memoryCache.get<AlunoBusca[]>('alunos') ?? []);
  // No celular a busca abre por cima da barra, no lugar da marca. Fecha ao
  // trocar de tela (inclusive pela barra de baixo): o caminho guardado aqui é
  // comparado durante o render, sem efeito.
  const [buscaAberta, setBuscaAberta] = useState(false);
  const [caminhoDaBusca, setCaminhoDaBusca] = useState(location.pathname);
  if (caminhoDaBusca !== location.pathname) {
    setCaminhoDaBusca(location.pathname);
    setBuscaAberta(false);
  }

  // Detecta iOS (Safari não suporta beforeinstallprompt)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  const showIosInstall = isIos && !isStandalone;

  // Toggle theme class on body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }

    // A barra do topo é escura nos dois temas, então a barra do navegador (e a
    // de status no celular) acompanha esse escuro. O --bg-0 da raiz é sempre o
    // do tema escuro: o tema claro só troca os tokens a partir do <body>.
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    const escuro = getComputedStyle(document.documentElement).getPropertyValue('--bg-0').trim();
    if (themeColorMeta && escuro) {
      themeColorMeta.setAttribute('content', escuro);
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  // "/" ou Ctrl+K (Cmd+K no Mac) levam à busca de qualquer tela
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const atalhoK = e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey);
      const barra = e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey && !digitandoEm(document.activeElement);
      if (!atalhoK && !barra) return;
      // Com um modal aberto o atalho não tira o foco de dentro dele
      if (document.body.classList.contains('modal-aberto')) return;
      e.preventDefault();
      setBuscaAberta(true);
      // O campo do celular só existe depois de abrir; o do desktop já está lá
      window.setTimeout(() => document.getElementById(ID_BUSCA)?.focus(), 0);
    };
    window.addEventListener('keydown', aoTeclar);
    return () => window.removeEventListener('keydown', aoTeclar);
  }, []);

  // A lista vem do cache na hora; se tiver mais de um minuto, atualiza por trás
  const carregarAlunos = () => {
    const emCache = memoryCache.get<AlunoBusca[]>('alunos');
    if (emCache) setAlunosBusca(emCache);
    if (emCache && memoryCache.isFresh('alunos')) return;
    api.get('/alunos')
      .then((res) => {
        memoryCache.set('alunos', res.data);
        setAlunosBusca(res.data);
      })
      .catch(() => { /* sem rede: a busca segue com o que estiver em cache */ });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const itemDoTrilho = ({ isActive }: { isActive: boolean }) => `sidebar-item ${isActive ? 'active' : ''}`;

  return (
    <div className="app-shell">
      {/* iOS install hint */}
      {showIosHint && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={() => setShowIosHint(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Como instalar o app no iPhone"
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
                color: 'var(--accent-text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto'
              }}>
                <DeviceMobileIcon size={24} />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Instalar No Game</h3>
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
      {/* Sempre escura (.painel-escuro), nos dois temas: o mesmo preto com
          vermelho das telas de entrada */}
      <header className={`topbar painel-escuro${buscaAberta ? ' topbar--buscando' : ''}`}>
        <div className="topbar-left">
          <NavLink to="/" className="topbar-brand" aria-label="No Game - Página Inicial">
            <BrandLogo size={22} text="No Game" />
          </NavLink>
        </div>

        {/* Busca de aluno: abre direto as periodizações do escolhido. Esc com
            o campo vazio sai da busca (com texto, o Esc só limpa, como antes). */}
        <div
          className="topbar-busca"
          onKeyDownCapture={(e) => {
            if (e.key !== 'Escape' || (e.target as HTMLInputElement).value) return;
            (e.target as HTMLElement).blur();
            setBuscaAberta(false);
          }}
        >
          <CampoBusca
            label="Buscar aluno"
            rotuloOculto
            placeholder="Buscar aluno…"
            dica="/"
            idCampo={ID_BUSCA}
            itens={alunosBusca}
            chave={(a) => a.idAluno}
            texto={(a) => a.nome}
            onFocus={carregarAlunos}
            onEscolher={(a) => {
              (document.activeElement as HTMLElement | null)?.blur();
              setBuscaAberta(false);
              navigate(`/alunos/${a.idAluno}/periodizacoes`);
            }}
          />
          <button
            type="button"
            className="topbar-btn topbar-busca-fechar"
            onClick={() => setBuscaAberta(false)}
            aria-label="Fechar busca"
          >
            <XIcon size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="topbar-right">
          <button
            type="button"
            className="topbar-btn topbar-busca-abrir"
            onClick={() => {
              setBuscaAberta(true);
              window.setTimeout(() => document.getElementById(ID_BUSCA)?.focus(), 0);
            }}
            aria-label="Buscar aluno"
          >
            <MagnifyingGlassIcon size={18} aria-hidden="true" />
          </button>
          {(canInstall || showIosInstall) && (
            <button
              type="button"
              className="topbar-btn"
              onClick={() => (canInstall ? install() : setShowIosHint(true))}
              title="Instalar app"
              aria-label="Instalar aplicativo no dispositivo"
            >
              <DownloadSimpleIcon size={18} aria-hidden="true" />
            </button>
          )}
          <button
            type="button"
            className="topbar-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            aria-label={theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
          >
            {theme === 'dark' ? <SunIcon size={18} aria-hidden="true" /> : <MoonIcon size={18} aria-hidden="true" />}
          </button>
        </div>
      </header>


      {/* Main Layout containing Sidebar and Page Content */}
      <div className="main-layout">
        {/* Trilho fixo do desktop: ícone com o nome embaixo, sempre visível */}
        <aside className="app-sidebar">
          <nav className="sidebar-nav" aria-label="Navegação principal">
            <NavLink to="/" className={itemDoTrilho} end>
              <HouseIcon size={20} aria-hidden="true" />
              <span className="sidebar-label">Início</span>
            </NavLink>

            <NavLink to="/alunos" className={itemDoTrilho}>
              <UsersIcon size={20} aria-hidden="true" />
              <span className="sidebar-label">Alunos</span>
            </NavLink>

            {/* As abas da Biblioteca ficam na própria página (?tab=) */}
            <NavLink
              to="/exercicios"
              className={`sidebar-item ${isExerciciosRoute ? 'active' : ''}`}
              aria-current={isExerciciosRoute ? 'page' : undefined}
            >
              <BarbellIcon size={20} aria-hidden="true" />
              <span className="sidebar-label">Biblioteca</span>
            </NavLink>

            {user?.role === 'SUPERADMIN' && (
              <NavLink to="/admin" className={itemDoTrilho}>
                <ShieldIcon size={20} aria-hidden="true" />
                <span className="sidebar-label">Admin</span>
              </NavLink>
            )}

            <NavLink to="/configuracoes" className={itemDoTrilho}>
              <GearIcon size={20} aria-hidden="true" />
              <span className="sidebar-label">Config.</span>
            </NavLink>
          </nav>

          {/* Sair à vista, no pé do trilho (no celular fica no fim de Configurações) */}
          <div className="sidebar-rodape">
            <button type="button" className="sidebar-item sidebar-sair" onClick={handleLogout}>
              <SignOutIcon size={20} aria-hidden="true" />
              <span className="sidebar-label">Sair</span>
            </button>
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
            <HouseIcon size={22} aria-hidden="true" />
            <span>Início</span>
          </PressScale>
        </NavLink>
        <NavLink to="/alunos" className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <UsersIcon size={22} aria-hidden="true" />
            <span>Alunos</span>
          </PressScale>
        </NavLink>
        <NavLink to="/exercicios?tab=exercicios" className={`tab-bar-item ${isExerciciosRoute ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <BarbellIcon size={22} aria-hidden="true" />
            <span>Biblioteca</span>
          </PressScale>
        </NavLink>
        <NavLink to="/configuracoes" className={({ isActive }) => `tab-bar-item ${isActive ? 'active' : ''}`}>
          <PressScale as="span" className="tab-bar-inner">
            <GearIcon size={22} aria-hidden="true" />
            <span>Config.</span>
          </PressScale>
        </NavLink>
      </nav>
    </div>
  );
};
