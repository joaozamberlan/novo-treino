import React from 'react';
import { PainelMarca } from './PainelMarca';
import { useTema } from '../hooks/useTema';

// Peças comuns das telas de entrada do aluno (primeiro acesso pelo link e
// login por telefone + PIN). Mesmo desenho do login do treinador: painel de
// marca à esquerda no desktop, formulário direto sobre o fundo.

interface ShellProps {
  // Treinador do link; aparece acima do título quando a tela é dele
  profissional?: { nome: string; logoUrl?: string | null } | null;
  titulo: string;
  subtitulo?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}

export const AlunoAcessoShell: React.FC<ShellProps> = ({ profissional, titulo, subtitulo, children, rodape }) => {
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
    <div className="entrada entrada--form animate-in">
      <PainelMarca>
        <div className="acesso-cabecalho acesso-cabecalho--celular">{cabecalho}</div>
      </PainelMarca>

      <main className="entrada-escolha">
        <div className="entrada-escolha-conteudo acesso">
          <div className="acesso-cabecalho acesso-cabecalho--desktop">{cabecalho}</div>

          {children}

          {rodape && <div className="login-footer-support">{rodape}</div>}
        </div>
      </main>
    </div>
  );
};

// Foco automático só onde há mouse/teclado: no celular ele abriria o teclado
// por cima da tela antes de a pessoa ler o que está sendo pedido.
const temPonteiroFino = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

interface CampoProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hint?: string;
}

export const CampoTelefone: React.FC<CampoProps> = ({ id, label, value, onChange, disabled, autoFocus, hint }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    <div className="login-input-wrap">
      <input
        id={id}
        name={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        spellCheck={false}
        className="form-input"
        placeholder="(00) 90000-0000"
        value={value}
        maxLength={30}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        autoFocus={autoFocus && temPonteiroFino()}
      />
    </div>
    {hint && <span className="field-hint">{hint}</span>}
  </div>
);

interface CampoPinProps extends CampoProps {
  novo?: boolean;
  // Atalho ao lado do rótulo (ex.: "Esqueci meu PIN")
  acao?: React.ReactNode;
}

const DIGITOS = [0, 1, 2, 3];

// PIN em quatro casas, como a senha do celular. É um <input> de verdade por
// cima das casas (invisível): teclado numérico, colar e gerenciador de senhas
// funcionam, e as casas só desenham quantos dígitos já foram digitados.
export const CampoPin: React.FC<CampoPinProps> = ({ id, label, value, onChange, disabled, autoFocus, hint, novo, acao }) => (
  <div className="form-group">
    <div className="pin-rotulo">
      <label className="form-label" htmlFor={id}>{label}</label>
      {acao}
    </div>
    <div className={`pin-campo${disabled ? ' pin-campo--desativado' : ''}`}>
      <input
        id={id}
        name={id}
        type="password"
        inputMode="numeric"
        pattern="[0-9]*"
        spellCheck={false}
        autoComplete={novo ? 'new-password' : 'current-password'}
        value={value}
        maxLength={4}
        // Só dígitos: o teclado numérico do celular ainda deixa colar texto
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
        disabled={disabled}
        autoFocus={autoFocus && temPonteiroFino()}
      />
      {DIGITOS.map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={[
            'pin-celula',
            i < value.length ? 'pin-celula--cheia' : '',
            i === Math.min(value.length, 3) ? 'pin-celula--atual' : '',
          ].join(' ')}
        />
      ))}
    </div>
    {hint && <span className="field-hint">{hint}</span>}
  </div>
);
