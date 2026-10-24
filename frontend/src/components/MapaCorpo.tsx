import { MuscleMap, type Highlight } from 'js-rich-body-highlighter/react';
import { mascarasDaRegiao, type RegiaoGrupo } from '../utils/musculos';
import { useTemaClaro } from '../hooks/useTemaClaro';

// Frente e costas do corpo com os grupos treinados acesos em vermelho.
// Carregado sob demanda (React.lazy em VolumeSemanal): a biblioteca e as
// ilustrações ficam fora do pacote principal.

export type Sexo = 'male' | 'female';

interface MapaCorpoProps {
  // Séries por grupo muscular da visão atual, com a região que cada um acende
  volume: { grupo: string; series: number; regiao: RegiaoGrupo }[];
  sexo: Sexo;
  // Grupo em destaque (linha do placar sob o mouse/foco)
  grupoEmFoco: string | null;
  onFocarGrupo: (grupo: string | null) => void;
}

// 4 tons: a intensidade é a opacidade da camada vermelha sobre a ilustração
const TONS = [28, 46, 66, 88];

export default function MapaCorpo({ volume, sexo, grupoEmFoco, onFocarGrupo }: MapaCorpoProps) {
  const claro = useTemaClaro();
  // Lida do CSS a cada tema: o vermelho do claro e do escuro não são o mesmo
  const cor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#CF3427';

  // Grupos na mesma região somam no músculo: "Ombro anterior" e "Ombro
  // posterior" acendem um ombro só, com o total das séries dos dois
  const porMascara = new Map<string, { series: number; grupos: { grupo: string; series: number }[] }>();
  for (const { grupo, series, regiao } of volume) {
    for (const mascara of mascarasDaRegiao(regiao)) {
      const atual = porMascara.get(mascara) ?? { series: 0, grupos: [] };
      atual.series += series;
      atual.grupos.push({ grupo, series });
      porMascara.set(mascara, atual);
    }
  }

  const maior = Math.max(...[...porMascara.values()].map((m) => m.series), 1);
  const highlights: Highlight[] = [];
  for (const [mascara, { series, grupos }] of porMascara) {
    const tom = TONS[Math.min(TONS.length - 1, Math.ceil((series / maior) * TONS.length) - 1)];
    const emFoco = grupos.some((g) => g.grupo === grupoEmFoco);
    // Com um grupo em foco, ele vai ao máximo e os outros recuam
    const intensidade = grupoEmFoco ? (emFoco ? 100 : Math.round(tom * 0.35)) : tom;
    highlights.push({ group: mascara, intensity: intensidade, color: cor });
  }

  // Músculo sob o mouse: foca o grupo com mais séries naquela região
  const grupoDaMascara = (mascara: string) =>
    porMascara.get(mascara)?.grupos.reduce((a, b) => (b.series > a.series ? b : a)).grupo ?? null;

  const comum = {
    gender: sexo,
    theme: claro ? ('light' as const) : ('dark' as const),
    highlights,
    color: cor,
    hoverHighlight: false,
    onMuscleEnter: (m: { group: string }) => onFocarGrupo(grupoDaMascara(m.group)),
    onMuscleLeave: () => onFocarGrupo(null),
    onMuscleClick: (m: { group: string }) => onFocarGrupo(grupoDaMascara(m.group)),
  };

  return (
    <div className="vol-corpo" aria-hidden="true">
      <MuscleMap {...comum} view="front" className="vol-corpo-vista" />
      <MuscleMap {...comum} view="back" className="vol-corpo-vista" />
    </div>
  );
}
