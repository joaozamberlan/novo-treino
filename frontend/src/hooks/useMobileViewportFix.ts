import { useEffect } from 'react';

/**
 * Tracks how much taller `window.innerHeight` is than the VisualViewport —
 * i.e. how much of the screen the on-screen keyboard is covering that the
 * layout viewport doesn't know about — and exposes it as `--keyboard-inset`.
 *
 * Chrome/Android with `interactive-widget=resizes-content` already shrinks
 * `window.innerHeight` itself when the keyboard opens, so the gap stays ~0
 * there and this is a no-op (an earlier version of this hook unconditionally
 * resized modals off VisualViewport alone, which fought that native
 * resize and made the sheet jump — see git history). iOS Safari never
 * resizes the layout viewport for the keyboard, so a real gap shows up
 * there, and only then do we clamp bottom-sheet modals to the space
 * actually visible above the keyboard.
 */
export function useMobileViewportFix() {
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const update = () => {
      const gap = window.innerHeight - viewport.height - viewport.offsetTop;
      document.documentElement.style.setProperty('--keyboard-inset', `${gap > 60 ? gap : 0}px`);
    };

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);

    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
    };
  }, []);
}
