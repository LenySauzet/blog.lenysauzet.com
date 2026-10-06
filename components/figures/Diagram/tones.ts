/**
 * What a mark means, never what colour it is. Three is the whole vocabulary,
 * and a diagram needing a fourth is usually drawing two things at once: the
 * answer stands out by being the only thing in the accent, not by a second
 * accent set against the first. Two shades of one ramp measured 1.76 apart
 * trying exactly that, which reads as one line drawn twice.
 */
export const TONES = {
  /** What the figure found. The accent, and nothing else wears it. */
  subject: '[--tone:var(--primary)]',
  /** The geometry it was found in. */
  structure: '[--tone:var(--muted-foreground)]',
  /** Construction: an axis, a radius, anything the reader is not meant to read. */
  guide: '[--tone:var(--border)]',
} as const;

export type Tone = keyof typeof TONES;
