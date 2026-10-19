import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from 'react';
import { type StatusFaixa, COR_STATUS, TEXTO_STATUS, formatData, formatKg } from '../utils/progresso';

// Gráfico de linha em SVG, sem biblioteca: uma medida por gráfico (carga OU
// repetições), eixo de tempo real entre as sessões.
//  - carga: linha com área, o último ponto em vermelho e o valor escrito ao lado
//  - reps: faixa prescrita ao fundo e o ponto de cada sessão na cor do status
// Tocar ou passar o mouse mostra a sessão mais próxima.

export interface PontoGrafico {
  ts: number;
  kg: number | null;
  reps: number | null;
  status: StatusFaixa;
}

// 3 ou 4 marcas "redondas" dentro do domínio
function marcas(d0: number, d1: number, inteiro: boolean): number[] {
  const bruto = (d1 - d0) / 3;
  const pot = 10 ** Math.floor(Math.log10(bruto || 1));
  const passo = [1, 2, 2.5, 5, 10].map((m) => m * pot).find((p) => p >= bruto) ?? bruto;
  const p = inteiro ? Math.max(1, Math.round(passo)) : passo;
  const out: number[] = [];
  for (let v = Math.ceil(d0 / p) * p; v <= d1 + 1e-9; v += p) out.push(Number(v.toFixed(4)));
  return out;
}

export function MiniGrafico({
  pontos,
  medida,
  faixa,
  altura,
  detalhado = false,
  semEixo = false,
  statusVisivel = (s: StatusFaixa) => s,
}: {
  pontos: PontoGrafico[];
  medida: 'kg' | 'reps';
  faixa?: [number, number] | null;
  altura: number;
  detalhado?: boolean;
  semEixo?: boolean;
  statusVisivel?: (s: StatusFaixa) => StatusFaixa;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  const [largura, setLargura] = useState(0);
  const [ativo, setAtivo] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = caixa.current;
    if (!el) return;
    setLargura(el.clientWidth);
    const ro = new ResizeObserver(([e]) => setLargura(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // some o destaque quando o dedo sai da tela
  useEffect(() => {
    if (ativo == null) return;
    const fim = () => setAtivo(null);
    window.addEventListener('scroll', fim, { passive: true, once: true });
    return () => window.removeEventListener('scroll', fim);
  }, [ativo]);

  const comValor = pontos.filter((p) => p[medida] != null);
  if (comValor.length === 0) return null;
  const valores = comValor.map((p) => p[medida] as number);

  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (faixa) {
    min = Math.min(min, faixa[0]);
    max = Math.max(max, faixa[1]);
  }
  const folga = Math.max((max - min) * 0.2, medida === 'kg' ? 2 : 1);
  const d0 = Math.max(0, Math.floor(min - folga));
  const d1 = Math.ceil(max + folga);

  const rotuloFinal = medida === 'kg' && !detalhado && !semEixo;
  const esq = detalhado ? 32 : 6;
  const dir = rotuloFinal ? 40 : 8;
  const topo = 8;
  const base = detalhado ? altura - 20 : altura - 4;
  const W = Math.max(largura, 60);

  const t0 = comValor[0].ts;
  const t1 = comValor[comValor.length - 1].ts;
  const unico = t1 === t0;
  const x = (ts: number) => (unico ? (esq + W - dir) / 2 : esq + 6 + ((ts - t0) / (t1 - t0)) * (W - dir - esq - 12));
  const y = (v: number) => base - ((v - d0) / (d1 - d0 || 1)) * (base - topo);

  const xy = comValor.map((p) => [x(p.ts), y(p[medida] as number)] as const);
  const linha = xy.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const ultimo = xy[xy.length - 1];

  const ticksY = detalhado ? marcas(d0, d1, medida === 'reps') : [];
  // datas no eixo: no máximo uma a cada ~56px
  const passoX = Math.max(1, Math.ceil(comValor.length / Math.max(1, Math.floor((W - esq - dir) / 56))));
  const ticksX = detalhado ? comValor.filter((_, i) => i % passoX === 0 || i === comValor.length - 1) : [];

  const mover = (ev: PointerEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const mx = ev.clientX - r.left;
    let melhor = 0;
    xy.forEach(([px], i) => {
      if (Math.abs(px - mx) < Math.abs(xy[melhor][0] - mx)) melhor = i;
    });
    setAtivo(melhor);
  };

  const pa = ativo != null ? comValor[ativo] : null;
  const rotulo = medida === 'kg' ? 'Carga' : 'Repetições';

  return (
    <div
      ref={caixa}
      className="graf"
      style={{ height: altura }}
      onPointerMove={mover}
      onPointerDown={mover}
      onPointerLeave={() => setAtivo(null)}
    >
      {largura > 0 && (
        <svg
          width={W}
          height={altura}
          viewBox={`0 0 ${W} ${altura}`}
          role="img"
          aria-label={`${rotulo} da melhor série em ${comValor.length} ${comValor.length === 1 ? 'sessão' : 'sessões'}`}
        >
          {ticksY.map((v) => (
            <g key={v}>
              <line x1={esq} x2={W - dir} y1={y(v)} y2={y(v)} stroke="var(--border)" />
              <text x={esq - 6} y={y(v) + 3.5} textAnchor="end" className="graf-eixo">
                {formatKg(v)}
              </text>
            </g>
          ))}
          {ticksX.map((p) => (
            <text key={p.ts} x={x(p.ts)} y={altura - 4} textAnchor="middle" className="graf-eixo">
              {formatData(p.ts)}
            </text>
          ))}

          {faixa && (
            <rect
              x={esq}
              y={y(faixa[1])}
              width={W - esq - dir}
              height={Math.max(0, y(faixa[0]) - y(faixa[1]))}
              fill="var(--text-2)"
              fillOpacity={0.14}
            />
          )}

          {medida === 'kg' ? (
            <>
              {xy.length > 1 && (
                <path d={`${linha} L${ultimo[0]} ${base} L${xy[0][0]} ${base}Z`} fill="var(--text-0)" fillOpacity={0.07} />
              )}
              <path d={linha} fill="none" stroke="var(--text-0)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {detalhado &&
                xy.slice(0, -1).map(([px, py], i) => (
                  <circle key={i} cx={px} cy={py} r={3.5} fill="var(--text-0)" stroke="var(--bg-1)" strokeWidth={2} />
                ))}
              <circle cx={ultimo[0]} cy={ultimo[1]} r={8} fill="var(--accent)" fillOpacity={0.2} />
              <circle cx={ultimo[0]} cy={ultimo[1]} r={4.5} fill="var(--accent)" stroke="var(--bg-1)" strokeWidth={2} />
              {rotuloFinal && (
                <text x={ultimo[0] + 11} y={ultimo[1] + 4.5} className="graf-valor">
                  {formatKg(valores[valores.length - 1])}
                </text>
              )}
            </>
          ) : (
            <>
              <path d={linha} fill="none" stroke="var(--text-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              {xy.map(([px, py], i) => (
                <circle
                  key={i}
                  cx={px}
                  cy={py}
                  r={i === xy.length - 1 ? 4.5 : 3.5}
                  fill={COR_STATUS[statusVisivel(comValor[i].status)]}
                  stroke="var(--bg-1)"
                  strokeWidth={2}
                />
              ))}
            </>
          )}

          {ativo != null && (
            <>
              <line x1={xy[ativo][0]} x2={xy[ativo][0]} y1={topo - 4} y2={base} stroke="var(--border-strong)" />
              <circle cx={xy[ativo][0]} cy={xy[ativo][1]} r={7} fill="none" stroke="var(--text-0)" strokeWidth={2} />
            </>
          )}
        </svg>
      )}
      {pa && ativo != null && (
        <div
          className="prog-tooltip"
          style={{
            left: Math.min(Math.max(xy[ativo][0], 60), W - 60),
            top: xy[ativo][1] - 10,
          }}
        >
          <strong>
            {formatKg(pa.kg)} kg × {pa.reps ?? '—'}
          </strong>
          <span>
            {formatData(pa.ts)} · {TEXTO_STATUS[statusVisivel(pa.status)]}
          </span>
        </div>
      )}
    </div>
  );
}
