import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { X } from 'lucide-react';
import {
  type ExercicioProgresso,
  type Progresso,
  type StatusFaixa,
  dataParaTs,
  formatData,
  formatKg,
  statusAtual,
  statusReps,
  textoDiasDesde,
  ultimaSessao,
  variacaoKg,
} from '../utils/progresso';

const COR: Record<StatusFaixa, string> = {
  acima: 'var(--success)',
  dentro: 'var(--text-1)',
  abaixo: 'var(--warning)',
};

const TEXTO_STATUS: Record<StatusFaixa, string> = {
  acima: 'passou da faixa',
  dentro: 'dentro da faixa',
  abaixo: 'abaixo da faixa',
};

interface Ponto {
  ts: number;
  kg: number | null;
  reps: number | null;
  status: StatusFaixa;
}

const pontosDe = (e: ExercicioProgresso): Ponto[] =>
  e.sessoes.map((s) => ({
    ts: dataParaTs(s.data),
    kg: s.melhor.cargaKg,
    reps: s.melhor.repeticoes,
    status: statusReps(s.melhor.repeticoes, e.faixa),
  }));

// ─── gráfico de linha (uma medida por gráfico: carga OU repetições) ───
function GraficoLinha({
  pontos,
  medida,
  faixa,
  altura,
  detalhado = false,
  semEixo = false,
  statusVisivel = (s: StatusFaixa) => s,
}: {
  pontos: Ponto[];
  medida: 'kg' | 'reps';
  faixa?: [number, number] | null;
  altura: number;
  detalhado?: boolean;
  semEixo?: boolean;
  statusVisivel?: (s: StatusFaixa) => StatusFaixa;
}) {
  const valores = pontos.map((p) => p[medida]).filter((v): v is number => v != null);
  if (valores.length === 0) return null;

  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (faixa) {
    min = Math.min(min, faixa[0]);
    max = Math.max(max, faixa[1]);
  }
  const folga = Math.max((max - min) * 0.2, medida === 'kg' ? 2 : 1);
  const dominio: [number, number] = [Math.max(0, Math.floor(min - folga)), Math.ceil(max + folga)];
  // Mini gráfico: rótulos de mínimo e máximo, só se couberem sem encostar
  const vMin = Math.min(...valores);
  const vMax = Math.max(...valores);
  const ticks = (vMax - vMin) / (dominio[1] - dominio[0]) > 0.4 ? [vMin, vMax] : [vMax];
  const unico = pontos.length === 1;

  return (
    <div style={{ width: '100%', height: altura }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={pontos} margin={{ top: 6, right: 8, bottom: detalhado ? 0 : 2, left: 0 }}>
          {detalhado && <CartesianGrid vertical={false} stroke="var(--border)" />}
          {faixa && (
            <ReferenceArea
              y1={faixa[0]}
              y2={faixa[1]}
              fill="var(--text-2)"
              fillOpacity={0.12}
              stroke="none"
              ifOverflow="extendDomain"
            />
          )}
          <XAxis
            dataKey="ts"
            type="number"
            scale="time"
            domain={unico ? ['dataMin - 86400000', 'dataMax + 86400000'] : ['dataMin', 'dataMax']}
            ticks={pontos.map((p) => p.ts)}
            padding={{ left: 10, right: 10 }}
            hide={!detalhado}
            tickFormatter={(ts: number) => formatData(ts)}
            tick={{ fontSize: 10, fill: 'var(--text-2)' }}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            hide={semEixo}
            domain={dominio}
            ticks={detalhado ? undefined : ticks}
            interval={detalhado ? 'preserveEnd' : 0}
            width={detalhado ? 34 : 26}
            tick={{ fontSize: detalhado ? 10 : 9, fill: 'var(--text-2)' }}
            tickFormatter={(v: number) => formatKg(v)}
            tickLine={false}
            axisLine={false}
            allowDecimals={medida === 'kg'}
          />
          <Tooltip
            cursor={{ stroke: 'var(--border-strong)' }}
            isAnimationActive={false}
            content={({ active, payload }) => {
              const p = active && payload?.[0]?.payload as Ponto | undefined;
              if (!p) return null;
              return (
                <div className="prog-tooltip">
                  <strong>
                    {formatKg(p.kg)} kg × {p.reps ?? '—'}
                  </strong>
                  <span>
                    {formatData(p.ts)} · {TEXTO_STATUS[statusVisivel(p.status)]}
                  </span>
                </div>
              );
            }}
          />
          <Line
            dataKey={medida}
            type="linear"
            stroke="var(--text-1)"
            strokeWidth={2}
            connectNulls
            isAnimationActive={false}
            dot={(props: { cx?: number; cy?: number; index?: number; payload?: Ponto }) => {
              const { cx, cy, index = 0, payload } = props;
              if (cx == null || cy == null || !payload) return <g key={index} />;
              const ultimo = index === pontos.length - 1;
              return (
                <circle
                  key={index}
                  cx={cx}
                  cy={cy}
                  r={ultimo ? 4.5 : 3.5}
                  fill={COR[statusVisivel(payload.status)]}
                  stroke="var(--bg-1)"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6, stroke: 'var(--bg-1)', strokeWidth: 2, fill: 'var(--text-0)' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function Selo({ status }: { status: StatusFaixa }) {
  if (status === 'acima') return <span className="prog-selo acima">▲ Subir carga</span>;
  if (status === 'abaixo') return <span className="prog-selo abaixo">▼ Carga alta</span>;
  return null;
}

function Variacao({ e }: { e: ExercicioProgresso }) {
  const v = variacaoKg(e);
  if (e.sessoes.length < 2) return null;
  return (
    <span className="prog-variacao">
      {v > 0 ? `▲ +${formatKg(v)}` : v < 0 ? `▼ ${formatKg(v)}` : '='} kg
    </span>
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
  return createPortal(
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
    </div>,
    document.body,
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
  if (todos.length === 0) {
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
        <span><i style={{ background: COR.acima }} />Passou da faixa</span>
        <span><i style={{ background: COR.dentro }} />Dentro da faixa</span>
        <span><i style={{ background: COR.abaixo }} />Abaixo da faixa</span>
        <span className="prog-legenda-nota">Cada ponto é a melhor série (maior carga) de uma sessão.</span>
      </div>

      {progresso.fichas.map((f) => {
        const exs = f.exercicios.filter((e) => !filtro || (e.sessoes.length > 0 && statusAtual(e) === filtro));
        if (exs.length === 0) return null;
        return (
          <section key={f.idTreino} className="prog-ficha">
            <h3>{f.nome}</h3>
            <div className="prog-grid">
              {exs.map((e) => (
                <CardExercicio key={e.idTreinoExercicio} e={e} onOpen={() => setAberto(e)} />
              ))}
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

  return (
    <button type="button" className="prog-card" onClick={onOpen}>
      <div className="prog-card-topo">
        <span className="prog-card-nome">{e.nome}</span>
        <Selo status={statusAtual(e)} />
      </div>
      <div className="prog-card-valor">
        <span className="prog-valor">
          {formatKg(u.melhor.cargaKg)}
          <small> kg</small> × {u.melhor.repeticoes ?? '—'}
        </span>
        <Variacao e={e} />
      </div>
      <span className="prog-mini-rotulo">CARGA (KG)</span>
      <GraficoLinha pontos={pontos} medida="kg" altura={54} />
      <span className="prog-mini-rotulo">REPS{e.faixa ? ` · FAIXA ${e.faixa[0]}–${e.faixa[1]}` : ''}</span>
      <GraficoLinha pontos={pontos} medida="reps" faixa={e.faixa} altura={46} />
      <span className="prog-card-meta">
        {e.sessoes.length} {e.sessoes.length === 1 ? 'sessão' : 'sessões'} · desde {formatData(e.sessoes[0].data)}
      </span>
    </button>
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
