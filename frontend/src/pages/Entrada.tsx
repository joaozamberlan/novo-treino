import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Timer } from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useTema } from '../hooks/useTema';
import { PERFIL_KEY, type Perfil } from '../constants/storageKeys';

// Primeira tela de quem abre o site (ou o app instalado) sem sessão e sem
// nunca ter entrado neste aparelho. A escolha fica guardada: da próxima vez a
// raiz vai direto para o login certo.
export const Entrada: React.FC = () => {
  const navigate = useNavigate();
  useTema();

  useEffect(() => {
    document.title = 'TreinosApp';
  }, []);

  const escolher = (perfil: Perfil) => {
    localStorage.setItem(PERFIL_KEY, perfil);
    navigate(perfil === 'aluno' ? '/aluno/entrar' : '/login');
  };

  return (
    <div className="entrada animate-in">
      <section className="entrada-marca">
        <BrandLogo size={24} text="Treinos" className="entrada-logo" />

        <div className="entrada-chamada">
          <h1 className="entrada-titulo">
            Treino prescrito, <span>carga registrada.</span>
          </h1>
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
            <div style={{ color: 'var(--text-2)' }}>RIR 1</div>
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

      <main className="entrada-escolha">
        <div className="entrada-escolha-conteudo">
          <h2 className="entrada-pergunta">Como você usa o TreinosApp?</h2>

          <button type="button" className="entrada-opcao" onClick={() => escolher('aluno')}>
            <span className="entrada-opcao-topo">
              <span className="entrada-opcao-texto">
                <strong>Sou aluno</strong>
                <span>Ver meu treino e registrar minhas cargas</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </span>
            {/* O que o aluno faz no app: marca a série feita */}
            <span className="entrada-amostra entrada-amostra--aluno" aria-hidden="true">
              <span className="entrada-amostra-num">1</span>
              <span className="entrada-amostra-dado"><b>40</b> kg</span>
              <span className="entrada-amostra-dado"><b>10</b> reps</span>
              <span className="entrada-amostra-check"><Check size={14} strokeWidth={3} /></span>
            </span>
          </button>

          <button type="button" className="entrada-opcao" onClick={() => escolher('treinador')}>
            <span className="entrada-opcao-topo">
              <span className="entrada-opcao-texto">
                <strong>Sou treinador</strong>
                <span>Montar fichas e acompanhar meus alunos</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" />
            </span>
            {/* O que o treinador faz no app: prescreve o exercício */}
            <span className="entrada-amostra" aria-hidden="true">
              <span className="entrada-amostra-nome">Supino reto</span>
              <span className="entrada-amostra-dado"><b>3</b> × <b>8-12</b></span>
              <span className="entrada-amostra-descanso"><Timer size={11} strokeWidth={2.5} />90s</span>
            </span>
          </button>
        </div>
      </main>
    </div>
  );
};
