import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ClipboardList, Dumbbell } from 'lucide-react';
import { AlunoAcessoShell } from '../components/AlunoAcesso';
import { PERFIL_KEY, type Perfil } from '../constants/storageKeys';

// Primeira tela de quem abre o site (ou o app instalado) sem sessão e sem
// nunca ter entrado neste aparelho. A escolha fica guardada: da próxima vez a
// raiz vai direto para o login certo.
export const Entrada: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'TreinosApp';
  }, []);

  const escolher = (perfil: Perfil) => {
    localStorage.setItem(PERFIL_KEY, perfil);
    navigate(perfil === 'aluno' ? '/aluno/entrar' : '/login');
  };

  return (
    <AlunoAcessoShell titulo="Como você usa o TreinosApp?">
      <div className="perfil-opcoes">
        <button type="button" className="perfil-opcao" onClick={() => escolher('aluno')}>
          <span className="perfil-opcao-icone"><Dumbbell size={20} aria-hidden="true" /></span>
          <span className="perfil-opcao-texto">
            <strong>Sou aluno</strong>
            <span>Ver meu treino e registrar minhas cargas</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>

        <button type="button" className="perfil-opcao" onClick={() => escolher('treinador')}>
          <span className="perfil-opcao-icone"><ClipboardList size={20} aria-hidden="true" /></span>
          <span className="perfil-opcao-texto">
            <strong>Sou treinador</strong>
            <span>Montar fichas e acompanhar meus alunos</span>
          </span>
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </AlunoAcessoShell>
  );
};
