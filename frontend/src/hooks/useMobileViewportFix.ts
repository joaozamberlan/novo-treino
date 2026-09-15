import { useEffect } from 'react';

/**
 * Keeps a `--app-vh` CSS custom property in sync with the browser's
 * VisualViewport height. Fixed-position full-screen elements (like the
 * mobile modal/bottom-sheet backdrop) don't shrink on their own when the
 * on-screen keyboard opens, so they end up rendering behind it. Using
 * VisualViewport instead of `100dvh` for those elements' height lets them
 * react to the keyboard the same way the visible page content does.
 */
export function useMobileViewportFix() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateHeight = () => {
      document.documentElement.style.setProperty('--app-vh', `${viewport.height}px`);
    };

    updateHeight();
    viewport.addEventListener('resize', updateHeight);
    viewport.addEventListener('scroll', updateHeight);

    return () => {
      viewport.removeEventListener('resize', updateHeight);
      viewport.removeEventListener('scroll', updateHeight);
    };
  }, []);
}
