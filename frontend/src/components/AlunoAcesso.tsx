import React from 'react';

// Campos das telas de entrada do aluno (primeiro acesso pelo link e login por
// telefone + PIN). A moldura da tela é o AcessoShell, a mesma do treinador.

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
  // Muda a cada PIN recusado; a troca remonta as casas e elas tremem uma vez
  tremer?: number;
}

const DIGITOS = [0, 1, 2, 3];

// PIN em quatro casas, como a senha do celular. É um <input> de verdade por
// cima das casas (invisível): teclado numérico, colar e gerenciador de senhas
// funcionam, e as casas só desenham quantos dígitos já foram digitados.
export const CampoPin: React.FC<CampoPinProps> = ({ id, label, value, onChange, disabled, autoFocus, hint, novo, acao, tremer = 0 }) => (
  <div className="form-group">
    <div className="pin-rotulo">
      <label className="form-label" htmlFor={id}>{label}</label>
      {acao}
    </div>
    <div
      key={tremer}
      className={`pin-campo${disabled ? ' pin-campo--desativado' : ''}${tremer > 0 ? ' pin-campo--recusado' : ''}`}
    >
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
