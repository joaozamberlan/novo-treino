import { useEffect, useState } from 'react';

// TEMPORÁRIO — diagnóstico do teclado cobrindo o rodapé dos modais no iPhone
// (app instalado). Liga/desliga com 5 toques rápidos no logo do topo.
// Remover depois do diagnóstico.

const VIEWPORT_DEBUG_KEY = 'debug-viewport';

function toggleStored() {
  try {
    if (localStorage.getItem(VIEWPORT_DEBUG_KEY) === '1') localStorage.removeItem(VIEWPORT_DEBUG_KEY);
    else localStorage.setItem(VIEWPORT_DEBUG_KEY, '1');
  } catch { /* storage indisponível */ }
}

function isOn() {
  try {
    return localStorage.getItem(VIEWPORT_DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

function rect(el: Element | null) {
  if (!el) return '—';
  const r = el.getBoundingClientRect();
  return `${Math.round(r.top)}→${Math.round(r.bottom)}`;
}

function read() {
  const vv = window.visualViewport;
  const modal = document.querySelector('.modal-content');
  const footer = document.querySelector('.modal-footer');
  const backdrop = document.querySelector('.modal-backdrop');
  const active = document.activeElement;
  const vvBottom = vv ? vv.offsetTop + vv.height : NaN;
  const footerBottom = footer ? footer.getBoundingClientRect().bottom : NaN;
  return [
    `innerH ${window.innerHeight}  clientH ${document.documentElement.clientHeight}`,
    `vv.h ${vv ? Math.round(vv.height) : '—'}  vv.top ${vv ? Math.round(vv.offsetTop) : '—'}  vv.pageTop ${vv ? Math.round(vv.pageTop) : '—'}`,
    `scrollY ${Math.round(window.scrollY)}  --kb ${getComputedStyle(document.documentElement).getPropertyValue('--keyboard-inset').trim()}`,
    `backdrop ${rect(backdrop)}`,
    `modal ${rect(modal)}  ${modal ? `${modal.clientHeight}/${modal.scrollHeight} st${Math.round(modal.scrollTop)}` : ''}`,
    `footer ${rect(footer)}  ${footer ? getComputedStyle(footer).position : ''}`,
    `visível até ${Math.round(vvBottom)}  footer até ${Math.round(footerBottom)}  ${footerBottom > vvBottom + 1 ? 'ESCONDIDO' : 'ok'}`,
    `foco ${active ? active.tagName.toLowerCase() : '—'}  ${(navigator as Navigator & { standalone?: boolean }).standalone ? 'standalone' : 'browser'}`,
  ];
}

export function ViewportDebug() {
  const [on, setOn] = useState(isOn);
  const [lines, setLines] = useState<string[]>([]);
  const [top, setTop] = useState(0);

  useEffect(() => {
    const onToggle = () => {
      toggleStored();
      setOn(isOn());
    };
    window.addEventListener('viewport-debug-toggle', onToggle);
    return () => window.removeEventListener('viewport-debug-toggle', onToggle);
  }, []);

  useEffect(() => {
    if (!on) return;
    const tick = () => {
      setLines(read());
      setTop(window.visualViewport ? window.visualViewport.offsetTop : 0);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [on]);

  if (!on) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: `calc(${top}px + var(--sat) + 4px)`,
        left: 4,
        right: 4,
        zIndex: 9999,
        pointerEvents: 'none',
        background: 'rgba(0,0,0,0.85)',
        color: '#7CFC8A',
        font: '11px/1.35 ui-monospace, Menlo, monospace',
        padding: '6px 8px',
        borderRadius: 6,
        whiteSpace: 'pre',
        overflow: 'hidden',
      }}
    >
      {lines.join('\n')}
    </div>
  );
}
