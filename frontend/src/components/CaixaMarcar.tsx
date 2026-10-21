import React from 'react';

// Checkbox e radio do app. Desenho adaptado do "Cyberpunk Glitch Checkbox" de
// pharmacist-sabot no Uiverse (MIT): caixa octogonal e marca que entra com
// mola. Ficaram de fora o neon e o glitch do texto. O <input> é real (só
// invisível), então teclado, foco e leitor de tela funcionam como no nativo.
interface CaixaMarcarProps {
  type?: 'checkbox' | 'radio';
  name?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
  className?: string;
}

export const CaixaMarcar: React.FC<CaixaMarcarProps> = ({
  type = 'checkbox',
  name,
  checked,
  disabled,
  onChange,
  children,
  className,
}) => (
  <label className={`caixa-marcar${className ? ` ${className}` : ''}`}>
    <input
      type={type}
      name={name}
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span className="caixa-marcar-caixa" aria-hidden="true">
      <span className="caixa-marcar-marca" />
    </span>
    <span className="caixa-marcar-texto">{children}</span>
  </label>
);
