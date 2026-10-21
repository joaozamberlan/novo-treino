import { useEffect, useMemo, useState } from 'react';
import { ModalPortal } from './ModalPortal';
import { ArrowDown, ArrowUp, Barbell, Heartbeat, X } from '@phosphor-icons/react';
import { MiniGrafico as GraficoLinha, type PontoGrafico as Ponto } from './MiniGrafico';
import {
  type CardioProgresso,
  type ExercicioProgresso,
  type Progresso,
  type StatusFaixa,
  COR_STATUS as COR,
  dataParaTs,
  formatData,
  formatKg,
  statusAtual,
  statusReps,
  textoDiasDesde,
  ultimaSessao,
  variacaoKg,
} from '../utils/progresso';
import { modeloCardio } from '../utils/cardio';

const pontosDe = (e: ExercicioProgresso): Ponto[] =>
  e.sessoes.map((s) => ({
    ts: dataParaTs(s.data),
    kg: s.melhor.cargaKg,
    reps: s.melhor.repeticoes,
    status: statusReps(s.melhor.repeticoes, e.faixa),
  }));

function Selo({ status }: { status: StatusFaixa }) {
  if (status === 'acima') {
    return (
      <span className="prog-selo acima">
        <ArrowUp size={11} aria-hidden="true" /> Subir carga
      </span>
    );
  }
  if (status === 'abaixo') {
    return (
      <span className="prog-selo abaixo">
        <ArrowDown size={11} aria-hidden="true" /> Carga alta
      </span>
    );
  }
  return null;
}

// Placar das últimas sessões: carga em cima, reps embaixo e a cor do status
// no filete de baixo (com ▲/▼ no texto, para não depender só da cor)
const SESSOES_NO_PLACAR = 6;

function PlacarSessoes({ e }: { e: ExercicioProgresso }) {
  const sessoes = e.sessoes.slice(-SESSOES_NO_PLACAR);
  return (
    <ol className="prog-placar" aria-label="Últimas sessões" style={{ gridTemplateColumns: `repeat(${SESSOES_NO_PLACAR}, minmax(0, 1fr))` }}>
      {sessoes.map((s, i) => {
        const st = statusReps(s.melhor.repeticoes, e.faixa);
        return (
          <li key={s.data + i} className={`${st}${i === sessoes.length - 1 ? ' ultima' : ''}`}>
            <span className="prog-placar-kg">{formatKg(s.melhor.cargaKg)}</span>
            <span className="prog-placar-reps">
              ×{s.melhor.repeticoes ?? '—'}
              {st === 'acima' ? ' ▲' : st === 'abaixo' ? ' ▼' : ''}
            </span>
            <span className="prog-placar-data">{formatData(s.data)}</span>
          </li>
        );
      })}
    </ol>
  );
}

// ─── detalhe do exercício (gaveta lateral) ───
function DetalheExercicio({
  e,
  modo,
  onClose,
}: {
  e: ExercicioProgresso;
  modo: 'treinador' | 'aluno';
  onClose: () => void;
}) {
  const pontos = useMemo(() => pontosDe(e), [e]);
  const status = statusAtual(e);
  const statusVisivel = (s: StatusFaixa): StatusFaixa => (modo === 'aluno' && s === 'abaixo' ? 'dentro' : s);
  const maxSeries = Math.max(...e.sessoes.map((s) => s.series.length), 0);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => ev.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Portal no body: a transição de página usa transform, que prenderia o
  // position: fixed dentro do conteúdo (atrás do cabeçalho e sem cobrir o menu).
  // O ModalPortal também trava a rolagem do fundo e prende o foco no painel.
  return (
    <ModalPortal>
    <div className="prog-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="progDetalheTitulo">
      <div className="prog-drawer" onClick={(ev) => ev.stopPropagation()}>
        <div className="prog-drawer-head">
          <div>
            <span className="prog-eyebrow">{modo === 'treinador' ? 'Progresso do exercício' : 'Meu progresso'}</span>
            <h3 id="progDetalheTitulo">{e.nome}</h3>
            <p>
              Prescrição: {e.series} {e.series === 1 ? 'série' : 'séries'} · {e.repeticoes} reps
            </p>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fechar" autoFocus>
            <X size={18} />
          </button>
        </div>

        {status === 'acima' && (
          <div className="prog-aviso acima">
            {modo === 'treinador'
              ? '▲ Passou da faixa na última sessão: sugerido subir a carga.'
              : 'Você passou da faixa. Hora de subir a carga!'}
          </div>
        )}
        {status === 'abaixo' && modo === 'treinador' && (
          <div className="prog-aviso abaixo">▼ Ficou abaixo da faixa na última sessão: a carga pode estar alta.</div>
        )}

        <div className="prog-painel">
          <h4>Carga da melhor série (kg)</h4>
          <GraficoLinha pontos={pontos} medida="kg" altura={160} detalhado statusVisivel={statusVisivel} />
        </div>
        <div className="prog-painel">
          <h4>Repetições da melhor série{e.faixa ? ` · faixa ${e.faixa[0]}–${e.faixa[1]}` : ''}</h4>
          <GraficoLinha pontos={pontos} medida="reps" faixa={e.faixa} altura={140} detalhado statusVisivel={statusVisivel} />
        </div>
        <div className="prog-painel">
          <h4>Todas as séries</h4>
          <div style={{ overflowX: 'auto' }}>
            <table className="prog-tabela">
              <thead>
                <tr>
                  <th>DATA</th>
                  {Array.from({ length: maxSeries }, (_, i) => (
                    <th key={i}>SÉRIE {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...e.sessoes].reverse().map((s) => (
                  <tr key={s.data + s.series.length}>
                    <td className="prog-td-data">{formatData(s.data)}</td>
                    {Array.from({ length: maxSeries }, (_, i) => {
                      const serie = s.series[i];
                      if (!serie) return <td key={i}>—</td>;
                      const st = statusVisivel(statusReps(serie.repeticoes, e.faixa));
                      return (
                        <td key={i} className={`prog-td-${st}`}>
                          {formatKg(serie.cargaKg)} × {serie.repeticoes ?? '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}

// ─── painel do treinador: um cartão por exercício, agrupado por ficha ───
export function PainelProgresso({ progresso }: { progresso: Progresso | null }) {
  const [filtro, setFiltro] = useState<StatusFaixa | null>(null);
  const [aberto, setAberto] = useState<ExercicioProgresso | null>(null);

  if (!progresso) {
    return <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-2)' }}>Carregando progresso...</div>;
  }

  const todos = progresso.fichas.flatMap((f) => f.exercicios).filter((e) => e.sessoes.length > 0);
  const temCardioFeito = progresso.fichas.some((f) => (f.cardio?.sessoes.length ?? 0) > 0);
  if (todos.length === 0 && !temCardioFeito) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-1)' }}>
        O aluno ainda não registrou cargas no link desta periodização.
        <div style={{ fontSize: '0.8rem', color: 'var(--text-2)', marginTop: '0.35rem' }}>
          O progresso aparece aqui assim que ele marcar as primeiras séries como feitas.
        </div>
      </div>
    );
  }
  const nAcima = todos.filter((e) => statusAtual(e) === 'acima').length;
  const nAbaixo = todos.filter((e) => statusAtual(e) === 'abaixo').length;

  return (
    <div className="prog-painel-treinador">
      <div className="prog-resumo">
        <button
          type="button"
          className="prog-chip acima"
          aria-pressed={filtro === 'acima'}
          onClick={() => setFiltro(filtro === 'acima' ? null : 'acima')}
          disabled={nAcima === 0}
        >
          <b>{nAcima}</b> para subir carga
        </button>
        <button
          type="button"
          className="prog-chip abaixo"
          aria-pressed={filtro === 'abaixo'}
          onClick={() => setFiltro(filtro === 'abaixo' ? null : 'abaixo')}
          disabled={nAbaixo === 0}
        >
          <b>{nAbaixo}</b> com carga alta
        </button>
        {progresso.ultimaSessao && (
          <span className="prog-chip estatico">Último treino {textoDiasDesde(progresso.ultimaSessao)}</span>
        )}
      </div>
      <div className="prog-legenda">
        <span><i style={{ background: COR.acima }} />▲ Passou da faixa</span>
        <span><i style={{ background: COR.dentro }} />Dentro da faixa</span>
        <span><i style={{ background: COR.abaixo }} />▼ Abaixo da faixa</span>
        <span className="prog-legenda-nota">Cada sessão mostra a melhor série (maior carga).</span>
      </div>

      {progresso.fichas.map((f) => {
        const exs = f.exercicios.filter((e) => !filtro || (e.sessoes.length > 0 && statusAtual(e) === filtro));
        // O aeróbico não tem faixa de repetições: some quando há filtro ativo
        const cardio = filtro ? null : f.cardio;
        if (exs.length === 0 && !cardio) return null;
        return (
          <section key={f.idTreino} className="prog-ficha">
            <h3>{f.nome}</h3>
            <div className="prog-grid">
              {exs.map((e) => (
                <CardExercicio key={e.idTreinoExercicio} e={e} onOpen={() => setAberto(e)} />
              ))}
              {cardio && <CardCardio cardio={cardio} />}
            </div>
          </section>
        );
      })}

      {aberto && <DetalheExercicio e={aberto} modo="treinador" onClose={() => setAberto(null)} />}
    </div>
  );
}

function CardExercicio({ e, onOpen }: { e: ExercicioProgresso; onOpen: () => void }) {
  const u = ultimaSessao(e);
  const pontos = useMemo(() => pontosDe(e), [e]);

  if (!u) {
    return (
      <div className="prog-card vazio">
        <span className="prog-card-nome">{e.nome}</span>
        <span className="prog-card-meta">Sem registros ainda · faixa {e.repeticoes}</span>
      </div>
    );
  }

  const v = variacaoKg(e);
  return (
    <button type="button" className="prog-card" onClick={onOpen}>
      <div className="prog-card-topo">
        <Barbell size={18} weight="duotone" className="prog-card-icone" aria-hidden="true" />
        <span className="prog-card-nome">{e.nome}</span>
        <Selo status={statusAtual(e)} />
      </div>
      <div className="prog-card-valor">
        <span className="prog-valor">{formatKg(u.melhor.cargaKg)}</span>
        <span className="prog-valor-sub">
          kg ×<br />
          <b>{u.melhor.repeticoes ?? '—'} reps</b>
        </span>
        {e.sessoes.length > 1 && (
          <span className="prog-variacao">
            {v > 0 ? `+${formatKg(v)}` : v < 0 ? formatKg(v) : '='} kg
            <small>desde {formatData(e.sessoes[0].data)}</small>
          </span>
        )}
      </div>
      <GraficoLinha pontos={pontos} medida="kg" altura={52} />
      <PlacarSessoes e={e} />
      <span className="prog-card-meta">
        <span>
          {e.series} {e.series === 1 ? 'série' : 'séries'} · faixa {e.repeticoes}
        </span>
        <span>
          {e.sessoes.length} {e.sessoes.length === 1 ? 'sessão' : 'sessões'}
        </span>
      </span>
    </button>
  );
}

// Aeróbico da ficha: prescrito × o que o aluno marcou nas últimas sessões
const MAX_LINHAS_CARDIO = 6;

function CardCardio({ cardio }: { cardio: CardioProgresso }) {
  const nome = `Aeróbico · ${modeloCardio(cardio.tipo)?.nome ?? cardio.tipo}`;
  const ultima = cardio.sessoes[cardio.sessoes.length - 1];

  if (!ultima) {
    return (
      <div className="prog-card vazio">
        <span className="prog-card-nome">{nome}</span>
        <span className="prog-card-meta">Sem registros ainda · prescrito {cardio.minutos} min</span>
      </div>
    );
  }

  return (
    <div className="prog-card" style={{ cursor: 'default' }}>
      <div className="prog-card-topo">
        <Heartbeat size={18} weight="duotone" className="prog-card-icone" aria-hidden="true" />
        <span className="prog-card-nome">{nome}</span>
        {ultima.minutos < cardio.minutos && (
          <span className="prog-selo abaixo">
            <ArrowDown size={11} aria-hidden="true" /> Abaixo do prescrito
          </span>
        )}
      </div>
      <div className="prog-card-valor">
        <span className="prog-valor">{ultima.minutos}</span>
        <span className="prog-valor-sub">
          min
          <br />
          <b>de {cardio.minutos}</b>
        </span>
      </div>
      <table className="prog-tabela">
        <thead>
          <tr>
            <th>DATA</th>
            <th>FEITO</th>
          </tr>
        </thead>
        <tbody>
          {[...cardio.sessoes].reverse().slice(0, MAX_LINHAS_CARDIO).map((s, i) => (
            <tr key={s.data + i}>
              <td className="prog-td-data">{formatData(s.data)}</td>
              <td className={s.minutos < cardio.minutos ? 'prog-td-abaixo' : undefined}>{s.minutos} min</td>
            </tr>
          ))}
        </tbody>
      </table>
      <span className="prog-card-meta">
        {cardio.sessoes.length} {cardio.sessoes.length === 1 ? 'sessão' : 'sessões'} · desde {formatData(cardio.sessoes[0].data)}
      </span>
    </div>
  );
}

// ─── link público: progresso dos exercícios da ficha aberta ───
export function MeuProgresso({ progresso, idTreino }: { progresso: Progresso | null; idTreino: number | null }) {
  const [aberto, setAberto] = useState<ExercicioProgresso | null>(null);
  const ficha = progresso?.fichas.find((f) => f.idTreino === idTreino);
  const exs = ficha?.exercicios.filter((e) => e.sessoes.length > 0) ?? [];
  if (exs.length === 0) return null;

  // o aluno não vê o sinal de carga alta; só o convite para subir
  const statusAluno = (s: StatusFaixa): StatusFaixa => (s === 'abaixo' ? 'dentro' : s);

  return (
    <div className="card prog-meu">
      <h2>Meu progresso</h2>
      <div className="prog-meu-lista">
        {exs.map((e) => {
          const u = ultimaSessao(e);
          const v = variacaoKg(e);
          const recorde = v > 0 && u.melhor.cargaKg === Math.max(...e.sessoes.map((s) => s.melhor.cargaKg ?? 0));
          const pontos = pontosDe(e);
          return (
            <button key={e.idTreinoExercicio} type="button" className="prog-meu-linha" onClick={() => setAberto(e)}>
              <span className="prog-card-nome">
                {e.nome} {recorde && <span className="prog-recorde">· recorde</span>}
              </span>
              <span className="prog-meu-spark">
                <GraficoLinha pontos={pontos} medida="kg" altura={36} semEixo statusVisivel={statusAluno} />
              </span>
              <span className="prog-meu-texto">
                Último: <b>{formatKg(u.melhor.cargaKg)} kg × {u.melhor.repeticoes ?? '—'}</b>
                {e.sessoes.length > 1 &&
                  (v > 0 ? ` · ▲ +${formatKg(v)} kg desde ${formatData(e.sessoes[0].data)}` : ' · mesma carga')}
              </span>
              {statusAtual(e) === 'acima' && <span className="prog-meu-cta">Você passou da faixa. Hora de subir a carga!</span>}
            </button>
          );
        })}
      </div>
      {aberto && <DetalheExercicio e={aberto} modo="aluno" onClose={() => setAberto(null)} />}
    </div>
  );
}
