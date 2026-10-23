import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { memoryCache } from '../services/cache';
import {
  ArrowRightIcon,
  BarbellIcon,
  GearSixIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ShieldCheckIcon,
  UsersThreeIcon,
} from '@phosphor-icons/react';

interface Aluno {
  idAluno: number;
  nome: string;
  email?: string | null;
  ativo?: boolean;
}

export const Home: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const cachedAlunos = memoryCache.get<Aluno[]>('alunos') || [];
  const cachedCatalog = memoryCache.get<any>('catalogo');
  const initialExCount = cachedCatalog?.exercicios?.length || 0;

  const [alunos, setAlunos] = useState<Aluno[]>(cachedAlunos);
  const [exerciciosCount, setExerciciosCount] = useState<number>(initialExCount);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  const firstName = user?.nome?.split(' ')[0] ?? user?.nome ?? 'Treinador';

  useEffect(() => {
    document.title = 'Painel Operacional | No Game';

    // Fetch students in background
    api.get('/alunos')
      .then((res) => {
        if (Array.isArray(res.data)) {
          setAlunos(res.data);
          memoryCache.set('alunos', res.data);
        }
      })
      .catch((err) => console.error('Erro ao buscar alunos na Home:', err));

    // Fetch exercises in background
    api.get('/exercicios')
      .then((res) => {
        const count = Array.isArray(res.data) ? res.data.length : (res.data?.exercicios?.length || 0);
        if (count > 0) setExerciciosCount(count);
      })
      .catch(() => {});
  }, []);

  // Handle click outside search results & ESC
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Filter students for search dropdown
  const filteredAlunos = searchQuery.trim()
    ? alunos.filter((a) =>
        a.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 5)
    : [];

  const handleSelectAluno = (idAluno: number) => {
    setIsSearchOpen(false);
    navigate(`/alunos/${idAluno}/periodizacoes`);
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const recentAlunos = alunos.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* ─── Masthead Minimalista ─── */}
      <div className="hub-masthead">
        <div>
          <h1 className="hub-title">Olá, {firstName}</h1>
          <p className="hub-sub">Por onde você começa hoje?</p>
        </div>

        <div className="hub-status-pill">
          <span className="hub-status-dot" />
          <span>{alunos.length === 1 ? '1 aluno ativo' : `${alunos.length} alunos ativos`}</span>
        </div>
      </div>

      {/* ─── Spotlight / Quick Jump Bar ─── */}
      <div className="hub-spotlight-bar" ref={searchWrapRef}>
        <div className="hub-search-input-wrap">
          <MagnifyingGlassIcon size={18} className="hub-search-icon" />
          <input
            type="text"
            className="hub-search-input"
            placeholder="Buscar aluno por nome ou e-mail"
            aria-label="Buscar aluno por nome ou e-mail"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchOpen(true);
            }}
          />
        </div>

        {/* Dynamic Dropdown Filter */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="hub-search-results">
            {filteredAlunos.length > 0 ? (
              filteredAlunos.map((aluno) => (
                <button
                  type="button"
                  key={aluno.idAluno}
                  className="hub-search-item"
                  onClick={() => handleSelectAluno(aluno.idAluno)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="hub-recent-avatar">{getInitials(aluno.nome)}</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-0)' }}>
                        {aluno.nome}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-2)' }}>
                        {aluno.email || 'Sem e-mail cadastrado'}
                      </div>
                    </div>
                  </div>
                  <ArrowRightIcon size={16} className="hub-recent-arrow" aria-hidden="true" />
                </button>
              ))
            ) : (
              <div style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                Nenhum aluno encontrado para "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── Índice de módulos: linhas, não cartões ─── */}
      <nav className="hub-index" aria-label="Módulos">
        <div className="hub-index-row">
          <span className="hub-index-marca" aria-hidden="true">
            <UsersThreeIcon size={30} weight="duotone" />
            <span className="hub-index-num">01</span>
          </span>
          <div className="hub-index-main">
            <Link to="/alunos" className="hub-index-link">
              <h2 className="hub-index-title">Alunos e Prescrições</h2>
            </Link>
            <p className="hub-index-desc">
              Cadastre prontuários, estruture fichas de treinos, controle histórico de cargas e envie links interativos aos alunos.
            </p>
          </div>
          <div className="hub-index-stat">
            <span className="hub-index-stat-num">{alunos.length}</span>
            <span className="hub-index-stat-label">{alunos.length === 1 ? 'aluno' : 'alunos'}</span>
          </div>
          <button
            className="hub-index-add"
            onClick={() => navigate('/alunos', { state: { openAdd: true } })}
            aria-label="Cadastrar novo aluno"
            title="Cadastrar novo aluno"
          >
            <PlusIcon size={16} aria-hidden="true" />
          </button>
          <ArrowRightIcon size={18} className="hub-index-arrow" aria-hidden="true" />
        </div>

        <div className="hub-index-row">
          <span className="hub-index-marca" aria-hidden="true">
            <BarbellIcon size={30} weight="duotone" />
            <span className="hub-index-num">02</span>
          </span>
          <div className="hub-index-main">
            <Link to="/exercicios" className="hub-index-link">
              <h2 className="hub-index-title">Biblioteca de Exercícios</h2>
            </Link>
            <p className="hub-index-desc">
              Catálogo completo separado por grupamentos musculares, biomecânica, vídeos de execução e métodos avançados.
            </p>
          </div>
          <div className="hub-index-stat">
            {exerciciosCount > 0 && (
              <>
                <span className="hub-index-stat-num">{exerciciosCount}</span>
                <span className="hub-index-stat-label">exercícios</span>
              </>
            )}
          </div>
          <button
            className="hub-index-add"
            onClick={() => navigate('/exercicios', { state: { openAdd: true } })}
            aria-label="Cadastrar novo exercício"
            title="Cadastrar novo exercício"
          >
            <PlusIcon size={16} aria-hidden="true" />
          </button>
          <ArrowRightIcon size={18} className="hub-index-arrow" aria-hidden="true" />
        </div>

        <div className="hub-index-row">
          <span className="hub-index-marca" aria-hidden="true">
            <GearSixIcon size={30} weight="duotone" />
            <span className="hub-index-num">03</span>
          </span>
          <div className="hub-index-main">
            <Link to="/configuracoes" className="hub-index-link">
              <h2 className="hub-index-title">Configurações e Marca</h2>
            </Link>
            <p className="hub-index-desc">
              Personalize seu registro CREF, logotipo, contatos, link do WhatsApp e dados que aparecem no cabeçalho dos treinos.
            </p>
          </div>
          <div className="hub-index-stat" />
          <span className="hub-index-add-slot" />
          <ArrowRightIcon size={18} className="hub-index-arrow" aria-hidden="true" />
        </div>

        {user?.role === 'SUPERADMIN' && (
          <div className="hub-index-row">
            <span className="hub-index-marca" aria-hidden="true">
              <ShieldCheckIcon size={30} weight="duotone" />
              <span className="hub-index-num">04</span>
            </span>
            <div className="hub-index-main">
              <Link to="/admin" className="hub-index-link">
                <h2 className="hub-index-title">Administração Geral</h2>
              </Link>
              <p className="hub-index-desc">
                Controle de permissões, gestão de usuários e acesso global de profissionais ao sistema.
              </p>
            </div>
            <div className="hub-index-stat" />
            <span className="hub-index-add-slot" />
            <ArrowRightIcon size={18} className="hub-index-arrow" aria-hidden="true" />
          </div>
        )}
      </nav>

      {/* ─── Alunos recentes: lista corrida ─── */}
      <section className="hub-recents-section" aria-labelledby="hub-recents-title">
        <div className="hub-recents-header">
          <h2 className="hub-recents-title" id="hub-recents-title">
            Alunos recentes
          </h2>
          <Link
            to="/alunos"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--accent-text)',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Ver todos ({alunos.length}) →
          </Link>
        </div>

        {recentAlunos.length > 0 ? (
          <ul className="hub-recents-list">
            {recentAlunos.map((aluno) => (
              <li key={aluno.idAluno}>
                <Link className="hub-recent-row" to={`/alunos/${aluno.idAluno}/periodizacoes`}>
                  <span className="hub-recent-initials" aria-hidden="true">{getInitials(aluno.nome)}</span>
                  <span className="hub-recent-name">{aluno.nome}</span>
                  <span className="hub-recent-meta">{aluno.email || 'Acessar ficha de treinos'}</span>
                  <ArrowRightIcon size={16} className="hub-recent-arrow" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="hub-recents-vazio">
            Nenhum aluno cadastrado no momento.{' '}
            <Link to="/alunos" state={{ openAdd: true }} style={{ color: 'var(--accent-text)', fontWeight: 700 }}>
              Clique aqui para cadastrar seu primeiro aluno
            </Link>.
          </p>
        )}
      </section>
    </div>
  );
};
