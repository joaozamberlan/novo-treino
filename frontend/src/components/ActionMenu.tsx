import React, { useEffect, useId, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

export interface ActionMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface Props {
  items: ActionMenuItem[];
  label: string; // aria-label do botão (ex.: "Ações de Protocolo 1")
  // Conteúdo visível do gatilho; sem ele, o gatilho é o ícone "…"
  trigger?: React.ReactNode;
  // Lado do gatilho em que a lista se alinha. 'left' para gatilhos na borda
  // esquerda da tela, onde a lista alinhada à direita sairia cortada.
  align?: 'left' | 'right';
}

export const ActionMenu: React.FC<Props> = ({ items, label, trigger, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="action-menu" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={trigger ? 'btn btn-secondary btn-sm' : 'exercise-action-btn'}
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        title={trigger ? undefined : 'Mais ações'}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger ?? <MoreHorizontal size={16} />}
      </button>
      {open && (
        <div id={menuId} role="menu" className={`action-menu-list${align === 'left' ? ' action-menu-list--left' : ''}`}>
          {items.map((item, i) => (
            <React.Fragment key={item.label}>
              {item.danger && i > 0 && <div className="action-menu-sep" role="separator" />}
              <button
                type="button"
                role="menuitem"
                className={`action-menu-item${item.danger ? ' danger' : ''}`}
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};
