// Longer than any frame, and short enough that a tab coming back from the background
// does not leap by however long it was away.
const LONGEST_STEP = 0.1;

export const step = (seconds: number) => Math.min(seconds, LONGEST_STEP);
