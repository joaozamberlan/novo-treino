import { useTemaClaro } from '../hooks/useTemaClaro';
import { MuscleMap } from 'js-rich-body-highlighter/react';
import { REGIOES, type RegiaoGrupo } from '../utils/musculos';

// Silhueta pequena com o grupo aceso, na aba Grupos da Biblioteca: mostra
// qual músculo o grupo é. Carregada sob demanda (React.lazy no Catalog),
// como o mapa do volume semanal. "Sem região" não chega aqui.

// Medidas da ilustração (unidades do viewBox da biblioteca): a marca dos
// adutores usa o mesmo sistema para cair no lugar certo em qualquer tamanho
const LARGURA = 361.15625;
const ALTURA = 541.8666666666667;

// Face interna das duas coxas, de frente: a ilustração não tem máscara de
// adutores, então a marca é desenhada por cima, na mesma cor dos outros grupos
const ADUTOR_ESQUERDO = 'M169 257 Q157 258 150 265 Q149 285 156 301 Q161 311 166 318 Q171 307 172 295 Q173 273 169 257 Z';
const ADUTOR_DIREITO = 'M192 257 Q204 258 211 265 Q212 285 205 301 Q200 311 195 318 Q190 307 189 295 Q188 273 192 257 Z';

export default function MiniaturaMusculo({ regiao }: { regiao: Exclude<RegiaoGrupo, 'nenhuma'> }) {
  const claro = useTemaClaro();
  // Lida do CSS a cada tema: o vermelho do claro e do escuro não são o mesmo
  const cor = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#CF3427';

  return (
    <div className={`miniatura-musculo miniatura-musculo--${REGIOES[regiao].faixa}`}>
      <MuscleMap
        gender="male"
        view={REGIOES[regiao].lado}
        theme={claro ? 'light' : 'dark'}
        color={cor}
        highlights={REGIOES[regiao].mascaras.map((mascara) => ({ group: mascara, intensity: 100, color: cor }))}
        hoverHighlight={false}
        className="miniatura-musculo-mapa"
      />
      {regiao === 'adutores' && (
        <svg className="miniatura-musculo-extra" viewBox={`0 0 ${LARGURA} ${ALTURA}`}>
          <path d={ADUTOR_ESQUERDO} fill={cor} />
          <path d={ADUTOR_DIREITO} fill={cor} />
        </svg>
      )}
    </div>
  );
}
