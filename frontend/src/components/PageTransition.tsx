import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, transform: 'translateY(6px)' },
  animate: { opacity: 1, transform: 'translateY(0px)' },
};

const pageTransition = {
  type: 'spring' as const,
  bounce: 0,
  duration: 0.3,
};

/**
 * PageTransition — Apple-style critically damped page transition.
 * Wraps <Outlet /> in Layout to give each route a spring entrance.
 * Respects prefers-reduced-motion because <MotionConfig reducedMotion="user">
 * wraps the app root (see App.tsx) — this component doesn't need its own check.
 *
 * Sem variante de saída de propósito: com mode="wait" a rota nova esperava a
 * mola de saída da anterior terminar (~300ms de atraso a cada toque na
 * navegação). A página antiga sai no mesmo frame e a nova já responde.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        transition={pageTransition}
        style={{ height: '100%', display: 'contents' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
