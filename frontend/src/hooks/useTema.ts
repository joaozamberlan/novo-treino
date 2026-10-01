import { useEffect, useState } from 'react';

// Tema claro/escuro das telas do aluno, guardado em localStorage('theme') —
// a mesma chave que o Layout do treinador usa.
export function useTema() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.body.classList.toggle('light-theme', theme === 'light');
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      return next;
    });
  };

  return { theme, toggleTheme };
}
