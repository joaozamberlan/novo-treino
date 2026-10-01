import React from 'react';
import { BrandLogo } from './BrandLogo';
import { useTema } from '../hooks/useTema';

// Peças comuns das telas de entrada do aluno (primeiro acesso pelo link e
// login por telefone + PIN).

interface ShellProps {
  // Treinador do link; sem ele a tela usa a marca do app
  profissional?: { nome: string; logoUrl?: string | null } | null;
  titulo: string;
  subtitulo?: React.ReactNode;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}

export const AlunoAcessoShell: React.FC<ShellProps> = ({ profissional, titulo, subtitulo, children, rodape }) => {
  useTema();

  return (
    <div className="aluno-acesso animate-in">
      <div className="aluno-acesso-card">
        <div className="aluno-acesso-marca">
          {profissional?.logoUrl ? (
            <img src={profissional.logoUrl} alt="" className="aluno-acesso-logo" />
          ) : (
            <div className="aluno-acesso-logo aluno-acesso-logo--padrao">
              <BrandLogo size={24} showText={false} />
            </div>
          )}
          <span>{profissional?.nome ?? 'TreinosApp'}</span>
        </div>

        <h1 className="aluno-acesso-titulo">{titulo}</h1>
        {subtitulo && <p className="aluno-acesso-sub">{subtitulo}</p>}

        {children}
      </div>
      {rodape && <div className="aluno-acesso-rodape">{rodape}</div>}
    </div>
  );
};

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
    <input
      id={id}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      className="form-input"
      placeholder="(00) 90000-0000"
      value={value}
      maxLength={30}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      autoFocus={autoFocus}
    />
    {hint && <span className="field-hint">{hint}</span>}
  </div>
);

export const CampoPin: React.FC<CampoProps & { novo?: boolean }> = ({ id, label, value, onChange, disabled, autoFocus, hint, novo }) => (
  <div className="form-group">
    <label className="form-label" htmlFor={id}>{label}</label>
    <input
      id={id}
      type="password"
      inputMode="numeric"
      pattern="[0-9]*"
      autoComplete={novo ? 'new-password' : 'current-password'}
      className="form-input pin-input"
      placeholder="••••"
      value={value}
      maxLength={4}
      // Só dígitos: o teclado numérico do celular ainda deixa colar texto
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 4))}
      disabled={disabled}
      autoFocus={autoFocus}
    />
    {hint && <span className="field-hint">{hint}</span>}
  </div>
);
