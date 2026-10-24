import { lazy, Suspense, useId, useState } from 'react';
import type { FichaTreino } from '../types/treino';
import type { Sexo } from './MapaCorpo';
import { regiaoDoGrupo, type RegiaoGrupo } from '../utils/musculos';

// Séries prescritas por grupo muscular, em duas peças ligadas: o mapa do corpo
// (onde o treino bate) e o placar de séries (quanto). Um controle segmentado
// alterna entre a ficha aberta e a semana inteira (todas as fichas da
// periodização). Passar o mouse numa linha acende o músculo, e vice-versa.

const MapaCorpo = lazy(() => import('./MapaCorpo'));

interface VolumeSemanalProps {
  fichas: FichaTreino[];
  idFichaAtual?: number | null;
  // Sexo do cadastro do aluno ('masculino' | 'feminino'): escolhe o corpo do mapa
  sexoDoAluno?: string | null;
}

type Visao = 'ficha' | 'semana';

interface LinhaVolume {
  grupo: string;
  series: number;
  regiao: RegiaoGrupo;
}

function calcularVolume(fichas: FichaTreino[]): LinhaVolume[] {
  const porGrupo = new Map<string, LinhaVolume>();
  for (const ficha of fichas) {
    for (const item of ficha.exercicios || []) {
      const gm = item.exercicio.grupoMuscular;
      const grupo = gm?.nome || 'Outro';
      const atual = porGrupo.get(grupo) ?? { grupo, series: 0, regiao: gm ? regiaoDoGrupo(gm) : 'nenhuma' };
      atual.series += Number(item.series) || 0;
      porGrupo.set(grupo, atual);
    }
  }
  return [...porGrupo.values()]
    .filter((l) => l.series > 0)
    .sort((a, b) => b.series - a.series || a.grupo.localeCompare(b.grupo, 'pt-BR'));
}

const grupos = (n: number) => `${n} ${n === 1 ? 'grupo muscular' : 'grupos musculares'}`;

// Escolha de corpo lembrada só neste navegador
const CHAVE_SEXO = 'volume-corpo-sexo';
function sexoSalvo(): Sexo {
  try {
    return localStorage.getItem(CHAVE_SEXO) === 'female' ? 'female' : 'male';
  } catch {
    return 'male';
  }
}

const SEXO_DO_CADASTRO: Record<string, Sexo> = { masculino: 'male', feminino: 'female' };

export function VolumeSemanal({ fichas, idFichaAtual, sexoDoAluno }: VolumeSemanalProps) {
  const tituloId = useId();
  const [visao, setVisao] = useState<Visao>('ficha');
  // Corpo do mapa: a troca feita aqui nesta visita; senão o sexo do cadastro
  // do aluno; senão a última escolha deste aparelho
  const [sexoEscolhido, setSexoEscolhido] = useState<Sexo | null>(null);
  const sexo: Sexo = sexoEscolhido ?? (sexoDoAluno ? SEXO_DO_CADASTRO[sexoDoAluno] : undefined) ?? sexoSalvo();
  const [grupoEmFoco, setGrupoEmFoco] = useState<string | null>(null);

  const fichaAtual = fichas.find((f) => f.idTreino === idFichaAtual);
  // Com uma ficha só, "esta ficha" e "semana" são a mesma coisa: sem alternância.
  const podeAlternar = !!fichaAtual && fichas.length > 1;
  const visaoAtiva: Visao = podeAlternar ? visao : 'semana';

  const linhasSemana = calcularVolume(fichas);
  if (linhasSemana.length === 0) return null;

  const linhas = visaoAtiva === 'ficha' && fichaAtual ? calcularVolume([fichaAtual]) : linhasSemana;
  const maior = linhas[0]?.series ?? 0;
  // Pelo menos 10 casas por linha: com poucas séries a escala ainda fica legível
  const casas = Math.max(maior, 10);
  const total = linhas.reduce((acc, l) => acc + l.series, 0);

  const contexto = visaoAtiva === 'ficha'
    ? `em ${grupos(linhas.length)} · ${fichaAtual!.nome}`
    : `em ${grupos(linhas.length)} · ${fichas.length === 1 ? 'a ficha' : `as ${fichas.length} fichas`} da semana`;

  const trocarSexo = (s: Sexo) => {
    setSexoEscolhido(s);
    try {
      localStorage.setItem(CHAVE_SEXO, s);
    } catch {
      // sem armazenamento: vale só nesta visita
    }
  };

  return (
    <section className="vol-semanal" aria-labelledby={tituloId}>
      <header className="vol-head">
        <h2 id={tituloId}>Volume semanal</h2>
        {podeAlternar && (
          <div className="vol-segmentado" role="group" aria-label="Mostrar volume de" data-visao={visaoAtiva}>
            <button type="button" aria-pressed={visaoAtiva === 'ficha'} onClick={() => setVisao('ficha')}>
              Esta ficha
            </button>
            <button type="button" aria-pressed={visaoAtiva === 'semana'} onClick={() => setVisao('semana')}>
              Semana
            </button>
          </div>
        )}
      </header>

      {linhas.length > 0 ? (
        <div className="vol-corpo-placar">
          <div className="vol-corpo-coluna">
            <Suspense fallback={<div className="vol-corpo vol-corpo--carregando" aria-hidden="true" />}>
              <MapaCorpo volume={linhas} sexo={sexo} grupoEmFoco={grupoEmFoco} onFocarGrupo={setGrupoEmFoco} />
            </Suspense>
            <div className="vol-sexo" role="group" aria-label="Corpo do mapa">
              <button type="button" aria-pressed={sexo === 'male'} onClick={() => trocarSexo('male')}>
                Masculino
              </button>
              <button type="button" aria-pressed={sexo === 'female'} onClick={() => trocarSexo('female')}>
                Feminino
              </button>
            </div>
          </div>

          <div className="vol-placar">
            <p className="vol-total" aria-live="polite">
              <strong>{total}</strong>
              <span>
                {total === 1 ? 'série' : 'séries'} {contexto}
              </span>
            </p>
            {/* key na visão: ao trocar, os blocos acendem de novo em cascata */}
            <ul className="vol-lista" key={visaoAtiva}>
              {linhas.map((l) => (
                <li
                  key={l.grupo}
                  className={`vol-linha${grupoEmFoco === l.grupo ? ' em-foco' : ''}`}
                  tabIndex={0}
                  onMouseEnter={() => setGrupoEmFoco(l.grupo)}
                  onMouseLeave={() => setGrupoEmFoco(null)}
                  onFocus={() => setGrupoEmFoco(l.grupo)}
                  onBlur={() => setGrupoEmFoco(null)}
                >
                  <span className="vol-grupo">{l.grupo}</span>
                  <span className="vol-blocos" aria-hidden="true">
                    {Array.from({ length: casas }, (_, i) => (
                      <span
                        key={i}
                        className={`vol-bloco${i < l.series ? ' cheio' : ''}`}
                        style={i < l.series ? { animationDelay: `${Math.min(i, 12) * 14}ms` } : undefined}
                      />
                    ))}
                  </span>
                  <span className="vol-valor">
                    <b>{l.series}</b>
                    <span className="sr-only"> {l.series === 1 ? 'série' : 'séries'}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="vol-vazio">Esta ficha ainda não tem exercícios.</p>
      )}
    </section>
  );
}
