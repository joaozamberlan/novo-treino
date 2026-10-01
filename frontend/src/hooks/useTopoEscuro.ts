import { useEffect } from 'react';

// Telas cujo topo é o painel de marca escuro: a barra do navegador (e a de
// status no celular) acompanha esse topo em vez do fundo claro da página.
// A cor vem do token --bg-1 da raiz, que é sempre o do tema escuro: o tema
// claro só troca os tokens a partir do <body>.
export function useTopoEscuro() {
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return;
    const anterior = meta.getAttribute('content');
    const escuro = getComputedStyle(document.documentElement).getPropertyValue('--bg-1').trim();
    if (escuro) meta.setAttribute('content', escuro);
    return () => {
      if (anterior) meta.setAttribute('content', anterior);
    };
  }, []);
}
