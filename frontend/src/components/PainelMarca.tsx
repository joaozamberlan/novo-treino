import React, { Fragment } from 'react';
import { CheckIcon, TimerIcon } from '@phosphor-icons/react';
import { BrandLogo } from './BrandLogo';
import { useTopoEscuro } from '../hooks/useTopoEscuro';

interface Props {
  // 'h1' na tela em que a chamada é o título; nas telas de formulário ela é
  // só texto de marca ('p') e o título é o do formulário.
  chamadaComo?: 'h1' | 'p';
  // Cabeçalho da tela, mostrado dentro do painel no celular (ver AcessoShell)
  children?: React.ReactNode;
}

const CHAMADA = 'Treino prescrito, carga registrada.';

// Séries da ficha de amostra: duas feitas e a atual, em descanso
const SERIES = [
  { num: 1, reps: '12', carga: '30', nota: 'PR +2,5 kg', pr: true, feita: true },
  { num: 2, reps: '10', carga: '32', nota: 'RIR 1', feita: true },
  { num: 3, reps: '8-10', carga: '34', nota: 'Rest-pause', feita: false },
];

// Painel de marca das telas de entrada (escolha de perfil, logins, cadastro e
// primeiro acesso): logo, chamada e uma ficha de exercício do produto.
// É sempre escuro (.painel-escuro), qualquer que seja o tema da página, e o
// filete vermelho na borda é a assinatura dessas telas.
export const PainelMarca: React.FC<Props> = ({ chamadaComo: Chamada = 'p', children }) => {
  useTopoEscuro();

  return (
  <section className="entrada-marca painel-escuro">
    <BrandLogo size={24} text="No Game" className="entrada-logo" />

    {children}

    <div className="entrada-chamada">
      {/* As palavras sobem uma a uma: é o único momento orquestrado da tela */}
      <Chamada className="entrada-titulo">
        {/* Leitor de tela lê a frase inteira; as palavras soltas são só visuais */}
        <span className="sr-only">{CHAMADA}</span>
        {CHAMADA.split(' ').map((palavra, i) => (
          <Fragment key={i}>
            {i > 0 && ' '}
            <span aria-hidden="true" className="palavra" style={{ '--i': i } as React.CSSProperties}>{palavra}</span>
          </Fragment>
        ))}
      </Chamada>
      <p className="entrada-desc entra" style={{ '--i': 0 } as React.CSSProperties}>
        O treinador monta a ficha. O aluno registra cada série e acompanha a evolução.
      </p>
    </div>

    {/* Uma ficha como a do app: é o produto, não uma ilustração */}
    <div className="entrada-ficha entra" style={{ '--i': 1 } as React.CSSProperties} aria-hidden="true">
      <div className="entrada-ficha-topo">
        <span className="entrada-ficha-indice">01</span>
        <span className="entrada-ficha-nome">Supino inclinado com halteres</span>
        <span className="entrada-ficha-musculo">Peitoral superior</span>
      </div>
      <div className="entrada-ficha-colunas">
        <span>Série</span>
        <span>Reps</span>
        <span>Carga</span>
        <span />
        <span />
      </div>
      {SERIES.map((s) => (
        <div key={s.num} className={`entrada-ficha-serie${s.feita ? '' : ' entrada-ficha-serie--atual'}`}>
          <span className="entrada-ficha-num">{s.num}</span>
          <span><b>{s.reps}</b></span>
          <span><b>{s.carga}</b> kg</span>
          <span className={`entrada-ficha-nota${'pr' in s ? ' entrada-ficha-nota--pr' : ''}`}>{s.nota}</span>
          {s.feita ? (
            <span className="entrada-ficha-feita"><CheckIcon size={14} /></span>
          ) : (
            <span className="entrada-ficha-descanso"><TimerIcon size={12} />90s</span>
          )}
        </div>
      ))}
    </div>
  </section>
  );
};
