import React, { useId, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';

export interface Instrucao {
  idInstrucao: number;
  texto: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  instrucoes: Instrucao[];
  onSave: (texto: string) => Promise<void> | void;
  placeholder?: string;
  maxLength?: number;
}

const normalize = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Várias instruções podem conviver no mesmo campo, separadas por "; ".
// A sugestão sempre considera só o trecho depois do último ";".
const SEP = ';';

export const InstrucaoAutocomplete: React.FC<Props> = ({
  value,
  onChange,
  instrucoes,
  onSave,
  placeholder,
  maxLength,
}) => {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const cut = value.lastIndexOf(SEP);
  const previous = cut >= 0 ? value.slice(0, cut + 1) + ' ' : '';
  const query = (cut >= 0 ? value.slice(cut + 1) : value).trim();

  const matches = useMemo(() => {
    const q = normalize(query);
    return instrucoes
      .filter((i) => normalize(i.texto).includes(q) && normalize(i.texto) !== q)
      .slice(0, 6);
  }, [instrucoes, query]);

  const canSave =
    query.length > 0 &&
    !instrucoes.some((i) => normalize(i.texto) === normalize(query));

  const rows = [
    ...matches.map((m) => ({ kind: 'match' as const, texto: m.texto })),
    ...(canSave ? [{ kind: 'save' as const, texto: query }] : []),
  ];
  const visible = open && rows.length > 0;

  const pick = (row: (typeof rows)[number]) => {
    if (row.kind === 'match') onChange(previous + row.texto);
    else void onSave(row.texto);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!visible) {
      if (e.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + rows.length) % rows.length);
    } else if (e.key === 'Enter') {
      // Só intercepta o Enter quando há uma sugestão da biblioteca destacada
      if (rows[active]?.kind === 'match') {
        e.preventDefault();
        pick(rows[active]);
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        className="form-input"
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
        role="combobox"
        aria-expanded={visible}
        aria-controls={listId}
        aria-autocomplete="list"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
      />
      {visible && (
        <ul
          id={listId}
          role="listbox"
          style={{
            position: 'absolute',
            zIndex: 20,
            left: 0,
            right: 0,
            top: 'calc(100% + 4px)',
            margin: 0,
            padding: '0.25rem',
            listStyle: 'none',
            backgroundColor: 'var(--bg-2)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            maxHeight: '220px',
            overflowY: 'auto',
          }}
        >
          {rows.map((row, idx) => (
            <li
              key={row.kind + row.texto}
              role="option"
              aria-selected={idx === active}
              // mouseDown (não click) para acontecer antes do blur do input
              onMouseDown={(e) => {
                e.preventDefault();
                pick(row);
              }}
              onMouseEnter={() => setActive(idx)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.65rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                color: row.kind === 'save' ? 'var(--accent)' : 'var(--text-0)',
                backgroundColor: idx === active ? 'var(--bg-tertiary)' : 'transparent',
              }}
            >
              {row.kind === 'save' ? (
                <>
                  <Plus size={14} aria-hidden="true" />
                  <span>Salvar "{row.texto}" na biblioteca</span>
                </>
              ) : (
                row.texto
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
