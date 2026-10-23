import React, { useEffect, useState } from 'react';
import { useConfirmar } from '../hooks/useConfirmar';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import api from '../services/api';
import { PlusIcon, CaretRightIcon, PencilSimpleIcon, TrashIcon, XIcon, UsersIcon, MagnifyingGlassIcon } from '@phosphor-icons/react';
import { memoryCache } from '../services/cache';
import { estadoPeriodo, formatarDia, ROTULO_ESTADO } from '../utils/periodo';
import { ModalPortal } from '../components/ModalPortal';
import { Seletor } from '../components/Seletor';
import { mensagemDeErro, telefoneValido } from '../utils/alunoAcesso';
import { ROTULO_ACESSO, type AcessoAluno } from '../utils/acessoAluno';

const TELEFONE_INVALIDO = 'Informe o telefone com DDD. Ele é o login do aluno.';

interface Aluno {
  idAluno: number;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  ativo: boolean;
  acesso?: AcessoAluno;
  dataCadastro: string;
  protocolos?: { idProtocolo: number; nome: string; dataFim?: string | null }[];
}

const iniciais = (nome: string) => {
  const partes = nome.trim().split(/\s+/);
  return (partes.length >= 2 ? partes[0][0] + partes[partes.length - 1][0] : nome.slice(0, 2)).toUpperCase();
};

export const Alunos: React.FC = () => {
  const confirmar = useConfirmar();
  const navigate = useNavigate();
  const location = useLocation();
  const cachedAlunos = memoryCache.get<Aluno[]>('alunos');
  const [alunos, setAlunos] = useState<Aluno[]>(cachedAlunos || []);
  const [search, setSearch] = useState('');

  // Add form state
  const [showAddForm, setShowAddForm] = useState<boolean>(Boolean(location.state?.openAdd));
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  // Erro do campo telefone no cadastro e na edição (só um modal abre por vez)
  const [telefoneErro, setTelefoneErro] = useState('');

  // Edit form state
  const [editingAlunoId, setEditingAlunoId] = useState<number | null>(null);
  const [editNome, setEditNome] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editTelefone, setEditTelefone] = useState('');
  const [editAtivo, setEditAtivo] = useState(true);

  // Se já tem cache, não bloqueia com loading (0ms de espera)
  const [loading, setLoading] = useState(!cachedAlunos);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchAlunos = async () => {
    try {
      const response = await api.get('/alunos');
      setAlunos(response.data);
      memoryCache.set('alunos', response.data);
    } catch (err) {
      console.error(err);
      if (!cachedAlunos) {
        setError('Erro ao carregar lista de alunos.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'Alunos | No Game';
    fetchAlunos();
  }, []);

  useEffect(() => {
    if (location.state?.openAdd) {
      setShowAddForm(true);
    }
  }, [location.state]);

  // Fecha modais com tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showAddForm) setShowAddForm(false);
        if (editingAlunoId) cancelEdit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddForm, editingAlunoId]);

  const handleAddAluno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefoneValido(telefone)) {
      setTelefoneErro(TELEFONE_INVALIDO);
      return;
    }
    setActionLoading(true);
    setError('');

    try {
      const res = await api.post('/alunos', {
        nome,
        email: email || undefined,
        telefone,
      });

      const next = [res.data, ...alunos];
      setAlunos(next);
      memoryCache.set('alunos', next);
      setNome('');
      setEmail('');
      setTelefone('');
      setShowAddForm(false);
      toast.success('Aluno cadastrado com sucesso!');
    } catch (err) {
      console.error(err);
      const errText = mensagemDeErro(err, 'Erro ao adicionar aluno.');
      // Telefone repetido ou inválido se corrige no próprio campo
      if (/telefone/i.test(errText)) {
        setTelefoneErro(errText);
      } else {
        setError(errText);
        toast.error(errText);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const startEditAluno = (aluno: Aluno, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditingAlunoId(aluno.idAluno);
    setEditNome(aluno.nome);
    setEditEmail(aluno.email || '');
    setEditTelefone(aluno.telefone || '');
    setEditAtivo(aluno.ativo);
    setTelefoneErro('');
  };

  const cancelEdit = () => {
    setEditingAlunoId(null);
    setEditNome('');
    setEditEmail('');
    setEditTelefone('');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAlunoId) return;
    if (!telefoneValido(editTelefone)) {
      setTelefoneErro(TELEFONE_INVALIDO);
      return;
    }

    setActionLoading(true);
    setError('');

    const updatedData = {
      nome: editNome,
      email: editEmail || null,
      telefone: editTelefone,
      ativo: editAtivo,
    };

    // Optimistic UI + Cache
    const nextList = alunos.map(a => (a.idAluno === editingAlunoId ? { ...a, ...updatedData } : a));
    setAlunos(nextList);
    memoryCache.set('alunos', nextList);

    const targetId = editingAlunoId;
    cancelEdit();

    try {
      const res = await api.patch(`/alunos/${targetId}`, updatedData);
      // Trocar o telefone pode mudar a situação do acesso (ex.: deixou de ser inválido)
      setAlunos((atual) => {
        const lista = atual.map((a) => (a.idAluno === targetId ? { ...a, acesso: res.data.acesso } : a));
        memoryCache.set('alunos', lista);
        return lista;
      });
      toast.success('Dados do aluno atualizados!');
    } catch (err) {
      console.error('Erro ao atualizar aluno:', err);
      const errText = mensagemDeErro(err, 'Erro ao atualizar dados do aluno.');
      setError(errText);
      toast.error(errText);
      fetchAlunos();
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAluno = async (aluno: Aluno, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const confirmou = await confirmar({
      titulo: `Excluir ${aluno.nome}?`,
      mensagem: 'As periodizações, as fichas e todo o histórico de treinos deste aluno são apagados. Não dá para desfazer.',
      confirmar: 'Excluir aluno',
      perigo: true,
    });
    if (!confirmou) {
      return;
    }

    // Optimistic UI + Cache
    const nextList = alunos.filter(a => a.idAluno !== aluno.idAluno);
    setAlunos(nextList);
    memoryCache.set('alunos', nextList);
    memoryCache.invalidate(`periodizacoes-${aluno.idAluno}`);

    try {
      await api.delete(`/alunos/${aluno.idAluno}`);
      toast.success('Aluno removido com sucesso.');
    } catch (err: any) {
      console.error('Erro ao excluir aluno:', err);
      setError('Erro ao excluir aluno no servidor.');
      toast.error('Erro ao excluir aluno no servidor.');
      fetchAlunos();
    }
  };

  const filteredAlunos = alunos.filter((aluno) =>
    aluno.nome.toLowerCase().includes(search.toLowerCase())
  );

  // Skeleton Loading elegante se não houver dados em cache ainda
  if (loading && alunos.length === 0) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div className="flex-between">
          <h1>Alunos</h1>
          <div className="skeleton" style={{ width: '110px', height: '32px' }} />
        </div>
        <div className="skeleton" style={{ height: '38px' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="skeleton" style={{ height: '62px' }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in">
      {/* Header */}
      <header className="pagina-cabeca">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.35rem' }}>
            <span style={{ width: '7px', height: '7px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              GESTÃO DE ALUNOS // BASE ATIVA
            </span>
          </div>
          <h1 className="pagina-titulo">Alunos</h1>
        </div>
        <div className="pagina-cabeca-lado">
          <div className="pagina-contador">
            <strong>{alunos.length}</strong>
            <span>{alunos.length === 1 ? 'aluno cadastrado' : 'alunos cadastrados'}</span>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowAddForm(true);
              setTelefoneErro('');
              cancelEdit();
            }}
          >
            <PlusIcon size={16} />
            <span>Novo aluno</span>
          </button>
        </div>
      </header>

      {/* Error message */}
      {error && (
        <div className="badge badge-danger" style={{ display: 'block', padding: '0.75rem', textAlign: 'center', marginBottom: '0.75rem' }}>
          {error}
        </div>
      )}

      {/* Search */}
      <label className="busca-linha">
        <MagnifyingGlassIcon size={18} aria-hidden="true" />
        <input
          type="search"
          aria-label="Buscar aluno por nome"
          placeholder="Buscar aluno por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {/* Student List */}
      {filteredAlunos.length > 0 ? (
        <div>
          <div className="aluno-colunas" aria-hidden="true">
            <span />
            <span>Aluno</span>
            <span>Periodização atual</span>
            <span>Acesso</span>
            <span />
          </div>
          <div className="student-list">
            {filteredAlunos.map((aluno) => (
              <div
                key={aluno.idAluno}
                className={`student-item aluno-linha${aluno.ativo ? '' : ' inativo'}`}
                onClick={() => navigate(`/alunos/${aluno.idAluno}/periodizacoes`)}
              >
                <span className="aluno-iniciais" aria-hidden="true">{iniciais(aluno.nome)}</span>

                <div className="aluno-id">
                  <div className="student-item-name aluno-nome">{aluno.nome}</div>
                  <div className="aluno-contato">
                    {aluno.email && <span>{aluno.email}</span>}
                    {aluno.telefone && <span>{aluno.telefone}</span>}
                  </div>
                </div>

                <div className="aluno-plano">
                  {(() => {
                    const atual = aluno.protocolos?.[0];
                    if (!atual) return <span className="aluno-plano-vazio">Sem periodização atual</span>;
                    const estado = estadoPeriodo(null, atual.dataFim);
                    const fim = formatarDia(atual.dataFim);
                    return (
                      <>
                        <span className="aluno-plano-nome">{atual.nome}</span>
                        {fim && (
                          <span className={`aluno-plano-data${estado === 'encerrada' ? ' vencida' : ''}`}>
                            {estado === 'encerrada' ? `${ROTULO_ESTADO.encerrada.toLowerCase()} em ${fim}` : `até ${fim}`}
                          </span>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="aluno-linha-acesso">
                  {aluno.acesso && (
                    <span className={`badge ${ROTULO_ACESSO[aluno.acesso].classe}`} title={ROTULO_ACESSO[aluno.acesso].dica}>
                      {ROTULO_ACESSO[aluno.acesso].texto}
                    </span>
                  )}
                  {!aluno.ativo && <span className="badge badge-danger">Inativo</span>}
                </div>

                {/* Actions */}
                <div className="student-item-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="exercise-action-btn accent"
                    onClick={(e) => startEditAluno(aluno, e)}
                    title="Editar informações do aluno"
                  >
                    <PencilSimpleIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="exercise-action-btn danger"
                    onClick={(e) => handleDeleteAluno(aluno, e)}
                    title="Excluir aluno"
                  >
                    <TrashIcon size={14} />
                  </button>
                  <button
                    type="button"
                    className="exercise-action-btn"
                    onClick={() => navigate(`/alunos/${aluno.idAluno}/periodizacoes`)}
                    title="Ver periodizações"
                  >
                    <CaretRightIcon size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '4rem 2rem', gap: '0.75rem',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-l)',
          color: 'var(--text-2)',
        }}>
          <UsersIcon size={32} style={{ color: 'var(--text-2)', opacity: 0.5 }} />
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-1)' }}>
            {search ? `Nenhum aluno encontrado para "${search}"` : 'Nenhum aluno cadastrado ainda'}
          </div>
          {!search && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => { setShowAddForm(true); setTelefoneErro(''); cancelEdit(); }}
              style={{ marginTop: '0.25rem' }}
            >
              <PlusIcon size={14} />
              Adicionar primeiro aluno
            </button>
          )}
        </div>
      )}

      {/* Modal de Cadastro de Aluno */}
      {showAddForm && (
        <ModalPortal>
          <div 
            className="modal-backdrop" 
            onClick={() => setShowAddForm(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalNovoAlunoTitle"
          >
            <div 
              className="modal-content modal-content--form" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px' }}
            >
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      CADASTRO // NOVO ALUNO
                    </span>
                  </div>
                  <h3 id="modalNovoAlunoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                    Novo Aluno
                  </h3>
                </div>
                <button 
                  type="button"
                  className="btn btn-ghost btn-icon" 
                  onClick={() => setShowAddForm(false)} 
                  title="Fechar"
                  aria-label="Fechar modal"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAluno} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="nomeAluno">Nome completo *</label>
                  <input
                    id="nomeAluno"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Lucas Silva"
                    value={nome}
                    maxLength={120}
                    onChange={(e) => setNome(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="emailAluno">E-mail</label>
                  <input
                    id="emailAluno"
                    type="email"
                    className="form-input"
                    placeholder="lucas@exemplo.com"
                    value={email}
                    maxLength={254}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="telAluno">Telefone / WhatsApp *</label>
                  <input
                    id="telAluno"
                    type="tel"
                    className={`form-input ${telefoneErro ? 'form-input--error' : ''}`}
                    placeholder="(00) 90000-0000"
                    value={telefone}
                    maxLength={30}
                    onChange={(e) => { setTelefone(e.target.value); setTelefoneErro(''); }}
                    required
                    aria-describedby="telAlunoAjuda"
                  />
                  {telefoneErro
                    ? <span id="telAlunoAjuda" className="field-error" role="alert">{telefoneErro}</span>
                    : <span id="telAlunoAjuda" className="field-hint">É o login do aluno: ele confirma este número ao abrir o link pela primeira vez.</span>}
                </div>

                <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Cadastrando...' : 'Cadastrar Aluno'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Modal de Edição de Aluno */}
      {editingAlunoId && (
        <ModalPortal>
          <div 
            className="modal-backdrop" 
            onClick={cancelEdit}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalEditAlunoTitle"
          >
            <div 
              className="modal-content modal-content--form" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px' }}
            >
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      CONFIGURAÇÃO // ATUALIZAR DADOS
                    </span>
                  </div>
                  <h3 id="modalEditAlunoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                    Editar Aluno
                  </h3>
                </div>
                <button 
                  type="button"
                  className="btn btn-ghost btn-icon" 
                  onClick={cancelEdit} 
                  title="Fechar"
                  aria-label="Fechar modal"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="campoAlunosNomeCompleto">Nome completo *</label>
                  <input
                    id="campoAlunosNomeCompleto"
                    type="text"
                    className="form-input"
                    value={editNome}
                    maxLength={120}
                    onChange={(e) => setEditNome(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="campoAlunosEMail">E-mail</label>
                  <input
                    id="campoAlunosEMail"
                    type="email"
                    className="form-input"
                    value={editEmail}
                    maxLength={254}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="telAlunoEdit">Telefone / WhatsApp *</label>
                  <input
                    id="telAlunoEdit"
                    type="tel"
                    className={`form-input ${telefoneErro ? 'form-input--error' : ''}`}
                    placeholder="(00) 90000-0000"
                    value={editTelefone}
                    maxLength={30}
                    onChange={(e) => { setEditTelefone(e.target.value); setTelefoneErro(''); }}
                    required
                    aria-describedby="telAlunoEditAjuda"
                  />
                  {telefoneErro
                    ? <span id="telAlunoEditAjuda" className="field-error" role="alert">{telefoneErro}</span>
                    : <span id="telAlunoEditAjuda" className="field-hint">É o login do aluno: ele confirma este número ao abrir o link pela primeira vez.</span>}
                </div>

                <Seletor
                  label="Status do Aluno"
                  valor={editAtivo ? 'ativo' : 'inativo'}
                  opcoes={[
                    { valor: 'ativo', texto: 'Ativo' },
                    { valor: 'inativo', texto: 'Inativo' },
                  ]}
                  onChange={(v) => setEditAtivo(v === 'ativo')}
                />

                <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={cancelEdit}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

