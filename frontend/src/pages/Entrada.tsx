import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Timer } from 'lucide-react';
import { PainelMarca } from '../components/PainelMarca';
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
      <PainelMarca chamadaComo="h1" />

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
