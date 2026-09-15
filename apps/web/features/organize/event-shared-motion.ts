/** Shared poster/title morph between Your Events ↔ event surfaces. */
export const eventSharedLayoutTransition = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 32,
  mass: 0.92,
};

/** Soft pane enter for Home / People / Entry / Money / Updates. */
export const eventPaneMotion = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
};
