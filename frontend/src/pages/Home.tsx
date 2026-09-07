import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { memoryCache } from '../services/cache';
import { Search, ArrowRight } from 'lucide-react';

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
    document.title = 'Painel Operacional | TreinosApp';

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
    navigate(`/alunos/${idAluno}/treinos`);
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
          <div className="hub-eyebrow">PAINEL OPERACIONAL // SESSÃO ATIVA</div>
          <h1 className="hub-title">Olá, {firstName}</h1>
          <p className="hub-sub">Selecione um módulo ou busque um atleta diretamente pelo atalho rápido.</p>
        </div>

        <div className="hub-status-pill">
          <span className="hub-status-dot" />
          <span>SISTEMA PRONTO • {alunos.length} ALUNOS ATIVOS</span>
        </div>
      </div>

      {/* ─── Spotlight / Quick Jump Bar ─── */}
      <div className="hub-spotlight-bar" ref={searchWrapRef}>
        <div className="hub-search-input-wrap">
          <Search size={18} className="hub-search-icon" strokeWidth={2.2} />
          <input
            type="text"
            className="hub-search-input"
            placeholder="Digite o nome ou e-mail do aluno para prescrever direto... (Ex: Carlos, Mariana)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim().length > 0) setIsSearchOpen(true);
            }}
          />
          <span className="hub-kbd-pill">BUSCA RÁPIDA</span>
        </div>

        {/* Dynamic Dropdown Filter */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="hub-search-results">
            {filteredAlunos.length > 0 ? (
              filteredAlunos.map((aluno) => (
                <div
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
                  <span className="btn-hub-primary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.72rem' }}>
                    Abrir Treinos →
                  </span>
                </div>
              ))
            ) : (
              <div style={{ padding: '1rem 1.25rem', fontSize: '0.85rem', color: 'var(--text-2)' }}>
                Nenhum aluno encontrado para "{searchQuery}".
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 3 Hero Tactical Module Cards ─── */}
      <div className="hub-grid">
        {/* Card 01: Alunos */}
        <div className="hub-card">
          <div>
            <div className="hub-card-header">
              <span className="hub-card-tag">01 // GESTÃO DE ATLETAS</span>
              <span className="hub-card-stat">{alunos.length} ATIVOS</span>
            </div>
            <h2 className="hub-card-title">Alunos & Prescrições</h2>
            <p className="hub-card-desc">
              Cadastre prontuários, estruture fichas de treinos, controle histórico de cargas e envie links interativos aos alunos.
            </p>
          </div>
          <div className="hub-card-actions">
            <button className="btn-hub-primary" onClick={() => navigate('/alunos')}>
              <span>Acessar Alunos</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button
              className="btn-hub-subtle"
              onClick={() => navigate('/alunos', { state: { openAdd: true } })}
            >
              <span>+ Novo Aluno</span>
            </button>
          </div>
        </div>

        {/* Card 02: Biblioteca */}
        <div className="hub-card">
          <div>
            <div className="hub-card-header">
              <span className="hub-card-tag">02 // BANCO DE MOVIMENTOS</span>
              <span className="hub-card-stat">
                {exerciciosCount > 0 ? `${exerciciosCount} CADASTRADOS` : 'CATÁLOGO'}
              </span>
            </div>
            <h2 className="hub-card-title">Biblioteca de Exercícios</h2>
            <p className="hub-card-desc">
              Catálogo completo separado por grupamentos musculares, biomecânica, vídeos de execução e métodos avançados.
            </p>
          </div>
          <div className="hub-card-actions">
            <button className="btn-hub-primary" onClick={() => navigate('/exercicios')}>
              <span>Explorar Catálogo</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
            <button
              className="btn-hub-subtle"
              onClick={() => navigate('/exercicios', { state: { openAdd: true } })}
            >
              <span>+ Novo Exercício</span>
            </button>
          </div>
        </div>

        {/* Card 03: Configurações */}
        <div className="hub-card">
          <div>
            <div className="hub-card-header">
              <span className="hub-card-tag">03 // DADOS PROFISSIONAIS</span>
              <span className="hub-card-stat" style={{ color: 'var(--success)', borderColor: 'rgba(45, 168, 104, 0.3)' }}>
                CREF ATIVO
              </span>
            </div>
            <h2 className="hub-card-title">Configurações & Marca</h2>
            <p className="hub-card-desc">
              Personalize seu registro CREF, logotipo, contatos, link do WhatsApp e dados que aparecem no cabeçalho dos treinos.
            </p>
          </div>
          <div className="hub-card-actions">
            <button className="btn-hub-primary" onClick={() => navigate('/configuracoes')}>
              <span>Ajustar Perfil</span>
              <ArrowRight size={15} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Card 04: Superadmin if applicable */}
        {user?.role === 'SUPERADMIN' && (
          <div className="hub-card" style={{ borderColor: 'rgba(240, 68, 56, 0.3)' }}>
            <div>
              <div className="hub-card-header">
                <span className="hub-card-tag" style={{ color: 'var(--danger)' }}>04 // SISTEMA</span>
                <span className="hub-card-stat" style={{ color: 'var(--danger)' }}>SUPERADMIN</span>
              </div>
              <h2 className="hub-card-title">Administração Geral</h2>
              <p className="hub-card-desc">
                Controle de permissões, gestão de usuários e acesso global de profissionais ao sistema.
              </p>
            </div>
            <div className="hub-card-actions">
              <button
                className="btn-hub-primary"
                style={{ background: 'var(--danger)' }}
                onClick={() => navigate('/admin')}
              >
                <span>Painel Admin</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Fast Resume: 3 Recent Students (Clean & Minimalist, No Table) ─── */}
      <div className="hub-recents-section">
        <div className="hub-recents-header">
          <div className="hub-recents-title">
            <span>//</span> ATALHOS RÁPIDOS • ÚLTIMOS ALUNOS
          </div>
          <Link
            to="/alunos"
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              color: 'var(--accent)',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            Ver todos ({alunos.length}) →
          </Link>
        </div>

        {recentAlunos.length > 0 ? (
          <div className="hub-recents-grid">
            {recentAlunos.map((aluno) => (
              <div
                key={aluno.idAluno}
                className="hub-recent-card"
                onClick={() => navigate(`/alunos/${aluno.idAluno}/treinos`)}
              >
                <div className="hub-recent-card-left">
                  <div className="hub-recent-avatar">
                    {getInitials(aluno.nome)}
                  </div>
                  <div>
                    <div className="hub-recent-name">{aluno.nome}</div>
                    <div className="hub-recent-meta">
                      {aluno.email || 'Acessar ficha de treinos'}
                    </div>
                  </div>
                </div>
                <ArrowRight size={16} className="hub-recent-arrow" strokeWidth={2.5} />
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '1rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-2)' }}>
            Nenhum aluno cadastrado no momento.{' '}
            <Link to="/alunos" state={{ openAdd: true }} style={{ color: 'var(--accent)', fontWeight: 700 }}>
              Clique aqui para cadastrar seu primeiro aluno
            </Link>.
          </div>
        )}
      </div>
    </div>
  );
};
