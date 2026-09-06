import React from 'react';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  text?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  size = 22, 
  showText = true, 
  className = '',
  text = 'Treinos'
}) => {
  return (
    <div 
      className={`brand-logo-wrap ${className}`} 
      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 68 68"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
        aria-hidden="true"
      >
        {/* Bloco 1: Base sólida */}
        <rect x="14" y="36" width="10" height="20" rx="1.5" fill="currentColor" />
        {/* Bloco 2: Volume estrutural */}
        <rect x="29" y="26" width="10" height="30" rx="1.5" fill="currentColor" />
        {/* Bloco 3: Sobrecarga em ascensão com corte 45° em Vermelho Queimado */}
        <path d="M44 14L54 22V56H44V14Z" fill="var(--accent)" />
      </svg>
      {showText && (
        <span 
          style={{
            fontSize: '0.9375rem',
            fontWeight: 900,
            letterSpacing: '-0.035em',
            textTransform: 'uppercase',
            color: 'var(--text-0)',
            fontFamily: 'var(--font)'
          }}
        >
          {text}
        </span>
      )}
    </div>
  );
};
