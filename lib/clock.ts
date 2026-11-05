// Longer than any frame, short enough that a tab coming back does not leap.
const LONGEST_STEP = 0.1;

export const step = (seconds: number) => Math.min(seconds, LONGEST_STEP);
