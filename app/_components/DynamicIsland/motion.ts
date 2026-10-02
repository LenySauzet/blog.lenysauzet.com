export const MORPH = { type: 'spring', stiffness: 220, damping: 20, mass: 1 } as const;

export const FADE = { duration: 0.34, ease: [0.22, 0.61, 0.36, 1] } as const;

/** Shorter than the arrival: what is leaving should be gone before it is missed. */
export const LEAVE = { duration: 0.18, ease: [0.4, 0, 1, 1] } as const;

export const RESTS_BEFORE_OPENING = 180;
