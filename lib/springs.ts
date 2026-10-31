/**
 * One spring, running for the life of a control, that what it draws chases the
 * whole time. Nothing here is triggered: a chase lags while its mark is moving
 * and catches up once it stops, which is the softness under a drag and the
 * settle at the end of one, from a single behaviour.
 *
 * Derived from the reference's slider rather than guessed. Its fill trails a moving
 * pointer by 6.35 points at 125 points a second and converges to 0.001 the
 * moment the pointer holds still, and its clicks overshoot 1.2% of whatever
 * they cover. A lag of `2 * ratio * speed / frequency` and an overshoot of
 * `exp(-pi * ratio / sqrt(1 - ratio^2))` put that at a ratio of 0.81 and a
 * frequency of 25 rad/s, which is this.
 */
export const FOLLOW_SPRING = { stiffness: 632, damping: 41, mass: 1 };
