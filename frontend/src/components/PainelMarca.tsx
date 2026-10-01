import React from 'react';
import { Check, Timer } from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import { useTopoEscuro } from '../hooks/useTopoEscuro';

interface Props {
  // 'h1' na tela em que a chamada é o título; nas telas de formulário ela é
  // só texto de marca ('p') e o título é o do formulário.
  chamadaComo?: 'h1' | 'p';
  // Cabeçalho da tela, mostrado dentro do painel no celular (ver AlunoAcessoShell)
  children?: React.ReactNode;
}

// Painel de marca das telas de entrada (escolha de perfil, login do aluno,
// primeiro acesso): logo, chamada e a ficha de exercício da tela de login.
// É sempre escuro (.painel-escuro), qualquer que seja o tema da página.
export const PainelMarca: React.FC<Props> = ({ chamadaComo: Chamada = 'p', children }) => {
  useTopoEscuro();

  return (
  <section className="entrada-marca painel-escuro">
    <BrandLogo size={24} text="Treinos" className="entrada-logo" />

    {children}

    <div className="entrada-chamada">
      <Chamada className="entrada-titulo">
        Treino prescrito, <span>carga registrada.</span>
      </Chamada>
      <p className="entrada-desc">
        O treinador monta a ficha. O aluno registra cada série e acompanha a evolução.
      </p>
    </div>

    {/* A mesma ficha da tela de login: é o produto, não uma ilustração */}
    <div className="login-card-preview entrada-ficha" aria-hidden="true">
      <div className="login-card-preview-head">
        <div>
          <div className="login-card-tag">EXERCÍCIO 01 // PEITORAL & OMBRO</div>
          <div className="login-card-name">Supino Inclinado com Halteres</div>
        </div>
        <div className="login-card-pill-muscle">PEITORAL SUPERIOR</div>
      </div>
      <div className="login-mock-row completed">
        <div className="mock-badge-num">1</div>
        <div><strong>12 reps</strong></div>
        <div>30 kg</div>
        <div><span className="mock-pr-tag">PR +2.5kg</span></div>
        <div className="entrada-mock-feito"><Check size={14} strokeWidth={3} /></div>
      </div>
      <div className="login-mock-row completed">
        <div className="mock-badge-num">2</div>
        <div><strong>10 reps</strong></div>
        <div>32 kg</div>
        <div style={{ color: 'var(--text-1)' }}>RIR 1</div>
        <div className="entrada-mock-feito"><Check size={14} strokeWidth={3} /></div>
      </div>
      <div className="login-mock-row entrada-mock-atual">
        <div className="mock-badge-num">3</div>
        <div><strong>8-10 reps</strong></div>
        <div>34 kg</div>
        <div>REST-PAUSE</div>
        <div className="entrada-mock-descanso"><Timer size={12} strokeWidth={2.5} /><span>90s</span></div>
      </div>
    </div>
  </section>
  );
};
