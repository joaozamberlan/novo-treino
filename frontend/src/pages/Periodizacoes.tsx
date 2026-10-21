import React, { useEffect, useRef, useState } from 'react';
import { useConfirmar } from '../hooks/useConfirmar';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { ProtocoloResumo } from '../types/treino';
import { toast } from 'sonner';
import api from '../services/api';
import { Breadcrumb } from '../components/Breadcrumb';
import { memoryCache } from '../services/cache';
import { ActionMenu } from '../components/ActionMenu';
import { ROTULO_ACESSO, type AcessoAluno } from '../utils/acessoAluno';
import { estadoPeriodo, formatarDia, progressoPeriodo, ROTULO_ESTADO } from '../utils/periodo';
import {
  ArrowLeftIcon,
  ArrowsClockwiseIcon,
  CalendarBlankIcon,
  CopyIcon,
  FloppyDiskIcon,
  LinkSimpleIcon,
  PasswordIcon,
  PencilSimpleIcon,
  PlusIcon,
  ProhibitIcon,
  ShareNetworkIcon,
  TrashIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react';
import { ModalPortal } from '../components/ModalPortal';
import { Seletor } from '../components/Seletor';

interface Aluno {
  idAluno: number;
  nome: string;
  email?: string | null;
  tokenAcesso?: string | null;
  acesso?: AcessoAluno;
}

// Resumo da periodização com as contagens que a listagem devolve
interface Protocolo extends ProtocoloResumo {
  totalFichas?: number;
  totalExercicios?: number;
}

export const Periodizacoes: React.FC = () => {
  const confirmar = useConfirmar();
  const { idAluno } = useParams<{ idAluno: string }>();
  const navigate = useNavigate();

  // Aluno exibido agora: respostas de requisições de OUTRO aluno (troca de rota
  // sem desmontar a página) não podem sobrescrever a lista atual.
  const alunoAtualRef = useRef(idAluno);
  alunoAtualRef.current = idAluno;

  const cached = idAluno ? memoryCache.get<any>(`periodizacoes-${idAluno}`) : null;
  const [aluno, setAluno] = useState<Aluno | null>(cached?.aluno || null);
  const [protocolos, setProtocolos] = useState<Protocolo[]>(cached?.protocolos || []);
  const [loading, setLoading] = useState(!cached);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // --- FORM (CREATE / EDIT) ---
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProtocoloId, setEditingProtocoloId] = useState<number | null>(null);
  const [protoNome, setProtoNome] = useState('');
  const [protoObjetivo, setProtoObjetivo] = useState('');
  const [protoInicio, setProtoInicio] = useState('');
  const [protoFim, setProtoFim] = useState('');

  // --- DUPLICAR PARA OUTRO ALUNO ---
  const [copiando, setCopiando] = useState<Protocolo | null>(null);
  const [alunosDestino, setAlunosDestino] = useState<Aluno[]>([]);
  const [idAlunoDestino, setIdAlunoDestino] = useState<number>(0);
  const [duplicando, setDuplicando] = useState(false);

  const closeCopyModal = () => {
    setCopiando(null);
    setIdAlunoDestino(0);
  };

  const startCopyProtocolo = async (proto: Protocolo) => {
    setCopiando(proto);
    setIdAlunoDestino(Number(idAluno) || 0);
    try {
      const res = await api.get('/alunos');
      setAlunosDestino(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar lista de alunos.');
      setCopiando(null);
    }
  };

  const handleDuplicarProtocolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!copiando || !idAlunoDestino || duplicando) return;

    try {
      setDuplicando(true);
      await api.post(`/treinos/protocolos/${copiando.idProtocolo}/duplicar`, {
        idAlunoDestino,
      });
      memoryCache.invalidate(`periodizacoes-${idAlunoDestino}`);
      const nomeAluno = alunosDestino.find((a) => a.idAluno === idAlunoDestino)?.nome;
      toast.success(`"${copiando.nome}" copiada${nomeAluno ? ` para ${nomeAluno}` : ''}!`);
      closeCopyModal();
      if (idAlunoDestino === Number(idAluno)) loadData(false);
      else navigate(`/alunos/${idAlunoDestino}/periodizacoes`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao copiar periodização.');
    } finally {
      setDuplicando(false);
    }
  };

  // --- COPIAR DE OUTRO ALUNO (este aluno é o destino) ---
  const [showImport, setShowImport] = useState(false);
  const [alunosOrigem, setAlunosOrigem] = useState<Aluno[]>([]);
  const [idAlunoOrigem, setIdAlunoOrigem] = useState<number>(0);
  const [protocolosOrigem, setProtocolosOrigem] = useState<Protocolo[]>([]);
  const [idProtocoloOrigem, setIdProtocoloOrigem] = useState<number>(0);
  const [carregandoOrigem, setCarregandoOrigem] = useState(false);
  const [importando, setImportando] = useState(false);

  const closeImportModal = () => {
    setShowImport(false);
    setIdAlunoOrigem(0);
    setProtocolosOrigem([]);
    setIdProtocoloOrigem(0);
  };

  const openImportModal = async () => {
    setShowImport(true);
    try {
      const res = await api.get('/alunos');
      setAlunosOrigem(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar lista de alunos.');
      setShowImport(false);
    }
  };

  const handleSelectAlunoOrigem = async (id: number) => {
    setIdAlunoOrigem(id);
    setIdProtocoloOrigem(0);
    setProtocolosOrigem([]);
    if (!id) return;
    try {
      setCarregandoOrigem(true);
      const res = await api.get(`/treinos/protocolos/${id}`);
      setProtocolosOrigem(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao carregar periodizações do aluno.');
    } finally {
      setCarregandoOrigem(false);
    }
  };

  const handleImportarProtocolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProtocoloOrigem || !idAluno || importando) return;

    try {
      setImportando(true);
      await api.post(`/treinos/protocolos/${idProtocoloOrigem}/duplicar`, {
        idAlunoDestino: Number(idAluno),
      });
      const nome = protocolosOrigem.find((pr) => pr.idProtocolo === idProtocoloOrigem)?.nome;
      toast.success(`"${nome}" copiada para ${aluno?.nome || 'este aluno'}!`);
      memoryCache.invalidate(`periodizacoes-${idAluno}`);
      closeImportModal();
      loadData(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Erro ao copiar periodização.');
    } finally {
      setImportando(false);
    }
  };

  const resetForm = () => {
    setEditingProtocoloId(null);
    setProtoNome('');
    setProtoObjetivo('');
    setProtoInicio('');
    setProtoFim('');
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    resetForm();
  };

  const openNewForm = () => {
    resetForm();
    setShowFormModal(true);
  };

  const startEditProtocolo = (proto: Protocolo) => {
    setEditingProtocoloId(proto.idProtocolo);
    setProtoNome(proto.nome);
    setProtoObjetivo(proto.objetivo || '');
    setProtoInicio(proto.dataInicio ? proto.dataInicio.split('T')[0] : '');
    setProtoFim(proto.dataFim ? proto.dataFim.split('T')[0] : '');
    setShowFormModal(true);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFormModal();
        closeCopyModal();
        closeImportModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadData = async (showGlobalLoading = false) => {
    try {
      if (showGlobalLoading) setLoading(true);
      else setRefreshing(true);
      setError('');

      const alvo = idAluno;
      const [alunoRes, protocolosRes] = await Promise.all([
        api.get(`/alunos/${alvo}`),
        api.get(`/treinos/protocolos/${alvo}`),
      ]);

      if (alvo) {
        memoryCache.set(`periodizacoes-${alvo}`, { aluno: alunoRes.data, protocolos: protocolosRes.data });
      }
      // Usuário já trocou de aluno enquanto isso: só o cache (chave correta) é atualizado
      if (alunoAtualRef.current !== alvo) return;

      setAluno(alunoRes.data);
      setProtocolos(protocolosRes.data);
    } catch (err) {
      console.error('Erro ao carregar periodizações do aluno:', err);
      setError('Erro ao carregar periodizações do aluno.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const cachedNow = idAluno ? memoryCache.get<any>(`periodizacoes-${idAluno}`) : null;
    if (cachedNow) {
      setAluno(cachedNow.aluno);
      setProtocolos(cachedNow.protocolos);
      setLoading(false);
      loadData(false);
    } else {
      // Sem cache deste aluno: limpa o que era do aluno anterior para não
      // exibir (nem operar sobre) periodizações de outro aluno.
      setAluno(null);
      setProtocolos([]);
      setLoading(true);
      loadData(true);
    }
  }, [idAluno]);

  useEffect(() => {
    document.title = aluno ? `Periodizações - ${aluno.nome} | TreinosApp` : 'Periodizações | TreinosApp';
  }, [aluno]);

  const handleSaveProtocolo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!protoNome.trim()) {
      toast.error('Informe o nome da periodização.');
      return;
    }

    if (editingProtocoloId) {
      const targetId = editingProtocoloId;
      const nome = protoNome.trim();
      const objetivo = protoObjetivo.trim();

      try {
        await api.patch(`/treinos/protocolos/${targetId}`, {
          nome,
          objetivo: objetivo || null,
          dataInicio: protoInicio || null,
          dataFim: protoFim || null,
        });

        setProtocolos(prev => prev.map(p =>
          p.idProtocolo === targetId
            ? { ...p, nome, objetivo: objetivo || undefined, dataInicio: protoInicio || undefined, dataFim: protoFim || undefined }
            : p
        ));
        if (idAluno) memoryCache.invalidate(`periodizacoes-${idAluno}`);
        toast.success('Periodização atualizada com sucesso!');
        closeFormModal();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao atualizar periodização.');
      }
    } else {
      try {
        const res = await api.post(`/treinos/protocolos/${idAluno}`, {
          nome: protoNome.trim(),
          objetivo: protoObjetivo.trim() || undefined,
          dataInicio: protoInicio || undefined,
          dataFim: protoFim || undefined,
        });

        if (idAluno) memoryCache.invalidate(`periodizacoes-${idAluno}`);
        // O backend desativa as demais periodizações ao criar uma nova ativa
        setProtocolos(prev => [res.data, ...prev.map(p => ({ ...p, ativo: false }))]);
        toast.success('Periodização criada com sucesso!');
        closeFormModal();
      } catch (err) {
        console.error(err);
        toast.error('Erro ao criar periodização.');
      }
    }
  };

  const handleActivateProtocolo = async (proto: Protocolo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.patch(`/treinos/protocolos/${proto.idProtocolo}`, { ativo: true });
      setProtocolos(prev => prev.map(p => ({ ...p, ativo: p.idProtocolo === proto.idProtocolo })));
      if (idAluno) memoryCache.invalidate(`periodizacoes-${idAluno}`);
      toast.success(`"${proto.nome}" agora é a periodização atual.`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao marcar periodização como atual.');
    }
  };

  const handleDeleteProtocolo = async (proto: Protocolo) => {
    const confirmou = await confirmar({
      titulo: `Excluir a periodização "${proto.nome}"?`,
      mensagem: 'Todas as fichas dela são excluídas junto.',
      confirmar: 'Excluir periodização',
      perigo: true,
    });
    if (!confirmou) return;

    const remaining = protocolos.filter(p => p.idProtocolo !== proto.idProtocolo);
    setProtocolos(remaining);
    toast.success('Periodização excluída.');

    try {
      await api.delete(`/treinos/protocolos/${proto.idProtocolo}`);
      if (idAluno) memoryCache.invalidate(`periodizacoes-${idAluno}`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao excluir periodização no servidor.');
      loadData(false);
    }
  };

  const handleShare = (proto: Protocolo) => {
    const token = proto.tokenPublico || aluno?.tokenAcesso;
    if (!token) {
      toast.error('O acesso deste aluno foi revogado. Use "Acesso do aluno → Gerar novo link".');
      return;
    }
    const url = `${window.location.origin}/v/${token}`;
    navigator.clipboard.writeText(url);
    toast.success(`Link de "${proto.nome}" copiado!`);
  };

  // Links são por aluno: gerar ou revogar vale para todas as periodizações dele
  const invalidarCacheDoAluno = () => {
    if (!idAluno) return;
    memoryCache.invalidate(`periodizacoes-${idAluno}`);
    memoryCache.invalidate('treino-detalhe-');
  };

  const handleRegenerarLink = async () => {
    if (!aluno) return;
    const confirmou = await confirmar({
      titulo: `Gerar um novo link para ${aluno.nome}?`,
      mensagem: 'Os links enviados antes param de funcionar.',
      confirmar: 'Gerar novo link',
    });
    if (!confirmou) return;
    try {
      await api.post(`/alunos/${aluno.idAluno}/token/regenerar`);
      invalidarCacheDoAluno();
      await loadData(false);
      toast.success('Novo link gerado. Use "Compartilhar link" na periodização para enviar.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar novo link.');
    }
  };

  const handleRevogarLink = async () => {
    if (!aluno) return;
    const confirmou = await confirmar({
      titulo: `Revogar o acesso de ${aluno.nome}?`,
      mensagem: 'Ele sai do app na hora e os links enviados param de funcionar até você gerar um novo.',
      confirmar: 'Revogar acesso',
      perigo: true,
    });
    if (!confirmou) return;
    try {
      await api.post(`/alunos/${aluno.idAluno}/token/revogar`);
      invalidarCacheDoAluno();
      await loadData(false);
      toast.success('Acesso revogado.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao revogar o acesso.');
    }
  };

  // Para quando o aluno esquece o PIN: ele cria outro ao abrir o link de novo
  const handleRedefinirPin = async () => {
    if (!aluno) return;
    const confirmou = await confirmar({
      titulo: `Redefinir o PIN de ${aluno.nome}?`,
      mensagem: 'Ele sai do app e cria um PIN novo ao abrir o link do treino.',
      confirmar: 'Redefinir PIN',
    });
    if (!confirmou) return;
    try {
      await api.post(`/alunos/${aluno.idAluno}/pin/redefinir`);
      memoryCache.invalidate('alunos');
      invalidarCacheDoAluno();
      await loadData(false);
      toast.success(`PIN redefinido. Envie o link do treino de novo para ${aluno.nome} criar outro.`);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao redefinir o PIN.');
    }
  };

  if (loading && !aluno) {
    return (
      <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-s)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div className="skeleton" style={{ width: '180px', height: '26px' }} />
              <div className="skeleton" style={{ width: '120px', height: '14px' }} />
            </div>
          </div>
          <div className="skeleton" style={{ width: '160px', height: '32px' }} />
        </div>
        <div className="proto-lista">
          {[1, 2, 3].map(n => (
            <div key={n} className="proto-row" style={{ cursor: 'default' }}>
              <div className="skeleton" style={{ width: '45%', height: '20px' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!aluno && error) {
    return (
      <div className="proto-vazio animate-in">
        <WarningCircleIcon size={36} style={{ color: 'var(--danger-text)' }} />
        <h2>Aluno não encontrado</h2>
        <p style={{ color: 'var(--text-1)', maxWidth: '400px' }}>
          Este aluno não existe no banco de dados atual. Acesse a lista de alunos para cadastrar um novo ou selecionar um existente.
        </p>
        <Link to="/alunos" className="btn btn-primary btn-sm">
          Ir para Meus Alunos
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <Breadcrumb items={[{ label: 'Alunos', to: '/alunos' }, { label: aluno?.nome || '...' }]} />

        <div className="flex-between proto-cabeca" style={{ flexWrap: 'wrap', rowGap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem' }}>
            <Link to="/alunos" className="btn btn-ghost btn-icon" aria-label="Voltar para a lista de alunos">
              <ArrowLeftIcon size={18} />
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.2rem' }}>
                <span style={{ width: '7px', height: '7px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  PERIODIZAÇÕES{protocolos.length > 0 ? ` // ${protocolos.length}` : ''}
                </span>
              </div>
              <h1 className="pagina-titulo">{aluno?.nome}</h1>
              <p className="proto-cabeca-contato">
                {aluno?.email || 'Aluno'}
                {aluno?.acesso && (
                  <span
                    className={`badge ${ROTULO_ACESSO[aluno.acesso].classe}`}
                    title={ROTULO_ACESSO[aluno.acesso].dica}
                    style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}
                  >
                    {ROTULO_ACESSO[aluno.acesso].texto}
                  </span>
                )}
                {refreshing && <span style={{ color: 'var(--text-2)', marginLeft: '0.5rem', fontSize: '0.75rem' }}>Atualizando...</span>}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <ActionMenu
              label={`Acesso do aluno ${aluno?.nome ?? ''}`}
              trigger={<><LinkSimpleIcon size={16} /><span>Acesso do aluno</span></>}
              align="left"
              items={[
                // Só há PIN para redefinir depois que o aluno criou um
                ...(aluno?.acesso === 'PIN_CRIADO'
                  ? [{ label: 'Redefinir PIN', icon: <PasswordIcon size={14} />, onClick: handleRedefinirPin }]
                  : []),
                { label: 'Gerar novo link', icon: <ArrowsClockwiseIcon size={14} />, onClick: handleRegenerarLink },
                { label: 'Revogar acesso', icon: <ProhibitIcon size={14} />, onClick: handleRevogarLink, danger: true },
              ]}
            />
            <button className="btn btn-secondary btn-sm" onClick={openImportModal}>
              <CopyIcon size={16} />
              <span>Copiar de outro aluno</span>
            </button>
            <button className="btn btn-primary btn-sm" onClick={openNewForm}>
              <PlusIcon size={16} />
              <span>Nova Periodização</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="badge" style={{ display: 'block', padding: '0.75rem', textAlign: 'center', backgroundColor: 'rgba(255,80,80,0.1)', border: '1px solid var(--danger)', color: 'var(--danger-text)' }}>
          {error}
        </div>
      )}

      {protocolos.length > 0 ? (
        <div className="proto-lista">
          {protocolos.map((proto, i) => {
            const estado = estadoPeriodo(proto.dataInicio, proto.dataFim);
            const progresso = proto.ativo ? progressoPeriodo(proto.dataInicio, proto.dataFim) : null;
            const inicio = formatarDia(proto.dataInicio);
            const fim = formatarDia(proto.dataFim);
            const abrir = () => navigate(`/alunos/${idAluno}/treinos?periodizacao=${proto.idProtocolo}`);
            return (
              <div
                key={proto.idProtocolo}
                className={`proto-row${proto.ativo ? ' is-current' : ''}`}
                onClick={abrir}
              >
                <span className="proto-row-indice" aria-hidden="true">{String(protocolos.length - i).padStart(2, '0')}</span>
                <div className="proto-row-main">
                  <h3 className="proto-row-title">{proto.nome}</h3>
                  {proto.objetivo && <p className="proto-row-goal">{proto.objetivo}</p>}
                  {(proto.ativo || estado) && (
                    <div className="proto-badges">
                      {proto.ativo && <span className="proto-badge current">Atual</span>}
                      {estado && (
                        <span className={`proto-badge ${estado === 'encerrada' ? 'expired' : estado === 'andamento' ? 'running' : ''}`}>
                          {ROTULO_ESTADO[estado]}
                        </span>
                      )}
                    </div>
                  )}
                  {progresso && estado === 'andamento' && (
                    <div className="proto-tempo">
                      <span className="proto-tempo-texto">
                        Semana <strong>{progresso.semana}</strong> de {progresso.totalSemanas}
                      </span>
                      <span className="proto-tempo-trilho" aria-hidden="true">
                        <span className="proto-tempo-barra" style={{ width: `${Math.max(progresso.fracao * 100, 2)}%` }} />
                      </span>
                    </div>
                  )}
                  {proto.ativo && estado === 'encerrada' && (
                    <p className="proto-row-aviso">
                      O período desta periodização já terminou. Ela continua como a atual do aluno até você mudar.
                    </p>
                  )}
                </div>

                <div className="proto-row-num">
                  {proto.totalFichas !== undefined && (
                    <>
                      <strong>{proto.totalFichas}</strong>
                      <span>{proto.totalFichas === 1 ? 'ficha' : 'fichas'}</span>
                    </>
                  )}
                </div>
                <div className="proto-row-num">
                  {proto.totalExercicios !== undefined && (
                    <>
                      <strong>{proto.totalExercicios}</strong>
                      <span>{proto.totalExercicios === 1 ? 'exercício' : 'exercícios'}</span>
                    </>
                  )}
                </div>
                <div className="proto-row-datas">
                  {(inicio || fim) && (
                    <>
                      <CalendarBlankIcon size={12} aria-hidden="true" />
                      <span>{inicio || '...'}{fim ? ` até ${fim}` : ''}</span>
                    </>
                  )}
                </div>

                <div className="proto-row-acoes">
                  {!proto.ativo && (
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={(e) => handleActivateProtocolo(proto, e)}
                      title="Marcar esta periodização como a atual"
                    >
                      Marcar como Atual
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={(e) => { e.stopPropagation(); abrir(); }}
                  >
                    Ver Treino
                  </button>
                  <ActionMenu
                    label={`Ações de ${proto.nome}`}
                    items={[
                      { label: 'Compartilhar link', icon: <ShareNetworkIcon size={14} />, onClick: () => handleShare(proto) },
                      { label: 'Copiar para um aluno', icon: <CopyIcon size={14} />, onClick: () => startCopyProtocolo(proto) },
                      { label: 'Editar', icon: <PencilSimpleIcon size={14} />, onClick: () => startEditProtocolo(proto) },
                      { label: 'Excluir', icon: <TrashIcon size={14} />, onClick: () => handleDeleteProtocolo(proto), danger: true },
                    ]}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="proto-vazio">
          <p>Nenhuma periodização cadastrada para este aluno ainda.</p>
          <button type="button" className="btn btn-primary" onClick={openNewForm}>
            <PlusIcon size={16} />
            Criar primeira periodização
          </button>
        </div>
      )}

      {/* MODAL: COPIAR PERIODIZAÇÃO DE OUTRO ALUNO PARA ESTE */}
      {showImport && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={closeImportModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalImportarTitle"
          >
            <div
              className="modal-content modal-content--form"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px' }}
            >
              <div className="modal-header">
                <h3 id="modalImportarTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Copiar de outro aluno
                </h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeImportModal}
                  title="Fechar"
                  aria-label="Fechar modal"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleImportarProtocolo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                  Copia todas as fichas e exercícios da periodização escolhida para <strong>{aluno?.nome}</strong>.
                  A cópia mantém o nome, vira a periodização atual e pode ser editada depois.
                </p>

                <div className="form-group">
                  <Seletor
                    label="Aluno de origem *"
                    valor={idAlunoOrigem}
                    opcoes={alunosOrigem.map((a) => ({ valor: a.idAluno, texto: a.nome + (a.idAluno === Number(idAluno) ? ' (este aluno)' : '') }))}
                    onChange={handleSelectAlunoOrigem}
                    placeholder="Selecione um aluno"
                    obrigatorio
                  />
                </div>

                <div className="form-group">
                  <Seletor
                    label="Periodização *"
                    valor={idProtocoloOrigem}
                    opcoes={protocolosOrigem.map((pr) => ({ valor: pr.idProtocolo, texto: pr.nome + (pr.ativo ? ' (atual)' : '') }))}
                    onChange={setIdProtocoloOrigem}
                    placeholder={carregandoOrigem
                      ? 'Carregando...'
                      : idAlunoOrigem && protocolosOrigem.length === 0
                        ? 'Este aluno não tem periodizações'
                        : 'Selecione uma periodização'}
                    desabilitado={!idAlunoOrigem || carregandoOrigem}
                    obrigatorio
                  />
                </div>

                <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeImportModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!idProtocoloOrigem || importando}>
                    <CopyIcon size={16} />
                    <span>{importando ? 'Copiando...' : 'Copiar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* MODAL: COPIAR PERIODIZAÇÃO PARA UM ALUNO */}
      {copiando && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={closeCopyModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalCopiarTitle"
          >
            <div
              className="modal-content modal-content--form"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '460px' }}
            >
              <div className="modal-header">
                <h3 id="modalCopiarTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                  Copiar Periodização
                </h3>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeCopyModal}
                  title="Fechar"
                  aria-label="Fechar modal"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleDuplicarProtocolo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-1)' }}>
                  Copia todas as fichas e exercícios de <strong>{copiando.nome}</strong> para o aluno escolhido.
                  A cópia mantém o nome, vira a periodização atual do aluno e pode ser editada depois.
                </p>

                <div className="form-group">
                  <Seletor
                    label="Copiar para *"
                    valor={idAlunoDestino}
                    opcoes={alunosDestino.map((a) => ({ valor: a.idAluno, texto: a.nome + (a.idAluno === Number(idAluno) ? ' (este aluno)' : '') }))}
                    onChange={setIdAlunoDestino}
                    placeholder="Selecione um aluno"
                    obrigatorio
                  />
                </div>

                <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeCopyModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={!idAlunoDestino || duplicando}>
                    <CopyIcon size={16} />
                    <span>{duplicando ? 'Copiando...' : 'Copiar'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* ========================================================================= */}
      {/* MODAL: PERIODIZAÇÃO (NOVA / EDITAR) */}
      {/* ========================================================================= */}
      {showFormModal && (
        <ModalPortal>
          <div
            className="modal-backdrop"
            onClick={closeFormModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modalPeriodizacaoTitle"
          >
            <div
              className="modal-content modal-content--form"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '480px' }}
            >
              <div className="modal-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
                    <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--accent)', borderRadius: '1.5px', display: 'inline-block' }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6875rem', fontWeight: 800, color: 'var(--accent-text)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {editingProtocoloId ? 'ATUALIZAÇÃO // PERIODIZAÇÃO' : 'CADASTRO // PERIODIZAÇÃO'}
                    </span>
                  </div>
                  <h3 id="modalPeriodizacaoTitle" style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-0)' }}>
                    {editingProtocoloId ? 'Editar Periodização' : 'Nova Periodização'}
                  </h3>
                </div>
                <button
                  type="button"
                  className="modal-close"
                  onClick={closeFormModal}
                  title="Fechar"
                  aria-label="Fechar modal"
                >
                  <XIcon size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProtocolo} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="campoPeriodizacoesNomeDoProtocolo">Nome do Protocolo *</label>
                  <input
                    id="campoPeriodizacoesNomeDoProtocolo"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Hipertrofia 12 sem."
                    value={protoNome}
                    maxLength={120}
                    onChange={(e) => setProtoNome(e.target.value)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="campoPeriodizacoesObjetivo">Objetivo</label>
                  <input
                    id="campoPeriodizacoesObjetivo"
                    type="text"
                    className="form-input"
                    placeholder="Ex: Ganho de massa magra"
                    value={protoObjetivo}
                    maxLength={500}
                    onChange={(e) => setProtoObjetivo(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2" style={{ gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="campoPeriodizacoesDataInicio">Data Início</label>
                    <input
                      id="campoPeriodizacoesDataInicio"
                      type="date"
                      className="form-input"
                      value={protoInicio}
                      onChange={(e) => setProtoInicio(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="campoPeriodizacoesDataFim">Data Fim</label>
                    <input
                      id="campoPeriodizacoesDataFim"
                      type="date"
                      className="form-input"
                      value={protoFim}
                      onChange={(e) => setProtoFim(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer" style={{ margin: 0, marginTop: '0.5rem', paddingTop: '0.85rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={closeFormModal}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingProtocoloId ? <FloppyDiskIcon size={16} /> : <PlusIcon size={16} />}
                    <span>{editingProtocoloId ? 'Salvar Alterações' : 'Criar Periodização'}</span>
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
