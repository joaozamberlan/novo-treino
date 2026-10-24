import { useEffect, useState } from 'react';

// Segue a classe light-theme do <body>, que o tema troca a qualquer momento.
// As ilustrações do corpo pedem o tema por prop: não leem o CSS sozinhas.
export function useTemaClaro() {
  const [claro, setClaro] = useState(() => document.body.classList.contains('light-theme'));
  useEffect(() => {
    const obs = new MutationObserver(() => setClaro(document.body.classList.contains('light-theme')));
    obs.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);
  return claro;
}
