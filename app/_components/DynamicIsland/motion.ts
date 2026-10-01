/**
 * Shared by the container and by whatever it is holding, which is the point: the
 * content grows on the very spring the island grows on, so the two read as one
 * object changing size rather than as a box resizing around its contents.
 *
 * Damping ratio 0.68 at 14.8 rad/s, which is `stiffness = f^2` and
 * `damping = 2 * ratio * sqrt(stiffness)`. It settles in about four tenths of a
 * second with one rebound you can see. The slider's own constants were tried first
 * and read as a snap at this size: the same ratio over a 20 pixel move and over a
 * 200 pixel one are two different feelings.
 */
export const MORPH = { type: 'spring', stiffness: 220, damping: 20, mass: 1 } as const;

/**
 * What fades rather than springs. Deliberately not an expo curve: that front-loads
 * the move, and a blur that is spent in the first fifty milliseconds may as well
 * not be there.
 */
export const FADE = { duration: 0.34, ease: [0.22, 0.61, 0.36, 1] } as const;
