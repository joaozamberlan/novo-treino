import { useEffect, useState } from 'react';
import { MuscleMap, type Highlight } from 'js-rich-body-highlighter/react';
import { regioesDoGrupo } from '../utils/musculos';

// Frente e costas do corpo com os grupos treinados acesos em vermelho.
// Carregado sob demanda (React.lazy em VolumeSemanal): a biblioteca e as
// ilustrações ficam fora do pacote principal.

export type Sexo = 'male' | 'female';

interface MapaCorpoProps {
  // Séries por grupo muscular da visão atual
  volume: { grupo: string; series: number }[];
  sexo: Sexo;
  // Grupo em destaque (linha do placar sob o mouse/foco)
  grupoEmFoco: string | null;
  onFocarGrupo: (grupo: string | null) => void;
}

// 4 tons: a intensidade é a opacidade da camada vermelha sobre a ilustração
const TONS = [28, 46, 66, 88];

function useTemaClaro() {
  const [claro, setClaro] = useState(() => document.body.classList.contains('light-theme'));
  useEffect(() => {
    const obs = new MutationObserver(() => setClaro(document.body.classList.contains('light-theme')));
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return claro;
}

export default function MapaCorpo({ volume, sexo, grupoEmFoco, onFocarGrupo }: MapaCorpoProps) {
  const claro = useTemaClaro();
  // Lida do CSS a cada tema: o vermelho do claro e do escuro não são o mesmo
  const cor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#CF3427';

  const maior = Math.max(...volume.map((v) => v.series), 1);
  const regiaoParaGrupo = new Map<string, string>();
  const highlights: Highlight[] = [];
  for (const { grupo, series } of volume) {
    const tom = TONS[Math.min(TONS.length - 1, Math.ceil((series / maior) * TONS.length) - 1)];
    const emFoco = grupoEmFoco === grupo;
    for (const regiao of regioesDoGrupo(grupo)) {
      regiaoParaGrupo.set(regiao, grupo);
      // Com um grupo em foco, ele vai ao máximo e os outros recuam
      const intensidade = grupoEmFoco ? (emFoco ? 100 : Math.round(tom * 0.35)) : tom;
      highlights.push({ group: regiao, intensity: intensidade, color: cor });
    }
  }

  const comum = {
    gender: sexo,
    theme: claro ? ('light' as const) : ('dark' as const),
    highlights,
    color: cor,
    hoverHighlight: false,
    onMuscleEnter: (m: { group: string }) => onFocarGrupo(regiaoParaGrupo.get(m.group) ?? null),
    onMuscleLeave: () => onFocarGrupo(null),
    onMuscleClick: (m: { group: string }) => onFocarGrupo(regiaoParaGrupo.get(m.group) ?? null),
  };

  return (
    <div className="vol-corpo" aria-hidden="true">
      <MuscleMap {...comum} view="front" className="vol-corpo-vista" />
      <MuscleMap {...comum} view="back" className="vol-corpo-vista" />
    </div>
  );
}
