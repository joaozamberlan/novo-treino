import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useLocation } from 'react-router-dom';

const pageVariants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -4 },
};

const pageTransition = {
  type: 'spring' as const,
  bounce: 0,
  duration: 0.3,
};

/**
 * PageTransition — Apple-style critically damped page transition.
 * Wraps <Outlet /> in Layout to give each route a spring entrance/exit.
 * Respects prefers-reduced-motion via Motion's built-in reducedMotion support.
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
        exit="exit"
        transition={pageTransition}
        style={{ height: '100%', display: 'contents' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
