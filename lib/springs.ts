/**
 * One spring, running for the life of a control, that what it draws chases the
 * whole time. Nothing here is triggered: a chase lags while its mark is moving
 * and catches up once it stops, which is the softness under a drag and the
 * settle at the end of one, from a single behaviour.
 *
 * Fitted to the reference's slider by measurement. Its clicks overshoot 1.2% of
 * what they cover, which `exp(-pi * ratio / sqrt(1 - ratio^2))` solves to a damping
 * ratio of 0.81; the stiffness was then fitted to its lag, 6.35 points behind a
 * pointer moving at 125 points a second, against 6.21 for this one.
 */
export const FOLLOW_SPRING = { stiffness: 632, damping: 41, mass: 1 };
