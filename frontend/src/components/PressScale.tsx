import { motion } from 'motion/react';
import React from 'react';

interface PressScaleProps {
  children: React.ReactNode;
  scale?: number;
  bounce?: number;
  duration?: number;
  className?: string;
  style?: React.CSSProperties;
  as?: keyof typeof motion;
  [key: string]: unknown;
}

/**
 * PressScale — Apple spring press feedback
 * Wraps any element and applies HIG-compliant spring physics on tap/press.
 *
 * Usage:
 *   <PressScale as="button" className="btn btn-primary" onClick={...}>
 *     Salvar
 *   </PressScale>
 *
 * Defaults: scale=0.95, critically damped (bounce=0), fast (duration=0.12s)
 * For momentum interactions (flick/drag release): use bounce=0.2, duration=0.3
 */
export const PressScale: React.FC<PressScaleProps> = ({
  children,
  scale = 0.95,
  bounce = 0,
  duration = 0.12,
  className,
  style,
  as = 'div',
  ...rest
}) => {
  const MotionTag = motion[as as 'div'] as React.ElementType;
  return (
    <MotionTag
      className={className}
      style={style}
      whileTap={{ scale }}
      transition={{ type: 'spring', bounce, duration }}
      {...rest}
    >
      {children}
    </MotionTag>
  );
};
