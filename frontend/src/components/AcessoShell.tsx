import React from 'react';
import { PainelMarca } from './PainelMarca';
import { useTema } from '../hooks/useTema';

// Moldura das telas de formulário de entrada: login e cadastro do treinador,
// login do aluno e primeiro acesso pelo link. Painel de marca escuro à
// esquerda no desktop (no topo no celular) e o formulário direto sobre o
// fundo, sem caixa em volta.

interface Props {
  // Treinador do link; aparece acima do título quando a tela é dele
  profissional?: { nome: string; logoUrl?: string | null } | null;
  titulo: string;
  subtitulo?: React.ReactNode;
  children: React.ReactNode;
  // Linhas de "outra forma de entrar", separadas por fio
  rodape?: React.ReactNode[];
  // Formulário mais largo (cadastro do treinador)
  largo?: boolean;
}

export const AcessoShell: React.FC<Props> = ({ profissional, titulo, subtitulo, children, rodape, largo }) => {
  useTema();

  // Desenhado duas vezes e mostrado uma: dentro do painel escuro no celular
  // (título branco sobre preto) e na coluna do formulário no desktop. O CSS
  // esconde a cópia que não vale, então leitores de tela veem um título só.
  const cabecalho = (
    <>
      {profissional && (
        <div className="acesso-treinador">
          {profissional.logoUrl ? (
            <img src={profissional.logoUrl} alt="" width={44} height={44} className="acesso-treinador-logo" />
          ) : (
            <span className="acesso-treinador-logo" aria-hidden="true">
              {profissional.nome.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="acesso-treinador-texto">
            <span>Seu treinador</span>
            <strong>{profissional.nome}</strong>
          </span>
        </div>
      )}

      <h1 className="acesso-titulo">{titulo}</h1>
      {subtitulo && <p className="acesso-sub">{subtitulo}</p>}
    </>
  );

  return (
    <div className="entrada entrada--form">
      <PainelMarca>
        <div className="acesso-cabecalho acesso-cabecalho--celular">{cabecalho}</div>
      </PainelMarca>

      <main className="entrada-escolha">
        <div className={`entrada-escolha-conteudo acesso${largo ? ' acesso--largo' : ''}`}>
          <div className="acesso-cabecalho acesso-cabecalho--desktop">{cabecalho}</div>

          {children}

          {rodape && rodape.length > 0 && (
            <ul className="acesso-rodape">
              {rodape.map((linha, i) => <li key={i}>{linha}</li>)}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};
