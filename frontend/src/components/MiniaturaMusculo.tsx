import { useTemaClaro } from '../hooks/useTemaClaro';
import { MuscleMap } from 'js-rich-body-highlighter/react';
import { faixaDoGrupo, ladoDoGrupo, regioesDoGrupo } from '../utils/musculos';

// Silhueta pequena com o grupo aceso, na aba Grupos da Biblioteca: mostra
// qual músculo o grupo é. Carregada sob demanda (React.lazy no Catalog),
// como o mapa do volume semanal. Grupo sem região no mapa não chega aqui.

export default function MiniaturaMusculo({ grupo }: { grupo: string }) {
  const claro = useTemaClaro();
  // Lida do CSS a cada tema: o vermelho do claro e do escuro não são o mesmo
  const cor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#CF3427';

  return (
    <MuscleMap
      gender="male"
      view={ladoDoGrupo(grupo)}
      theme={claro ? 'light' : 'dark'}
      color={cor}
      highlights={regioesDoGrupo(grupo).map((regiao) => ({ group: regiao, intensity: 100, color: cor }))}
      hoverHighlight={false}
      className={`miniatura-musculo miniatura-musculo--${faixaDoGrupo(grupo)}`}
    />
  );
}
