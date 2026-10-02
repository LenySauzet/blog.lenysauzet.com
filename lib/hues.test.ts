import { describe, expect, it } from 'vitest';

import { DEFAULT_HUE, HUES, hueOf } from './hues';

describe('hueOf', () => {
  it('answers the angle a preset stands for', () => {
    expect(hueOf('ember')).toBe(HUES.find((h) => h.id === 'ember')!.hue);
  });

  // The id comes out of storage, so it is whatever a reader last left there,
  // an older build wrote, or somebody typed into devtools.
  it('falls back to the default for anything it does not know', () => {
    const fallback = hueOf(DEFAULT_HUE.id);

    expect(hueOf('chartreuse')).toBe(fallback);
    expect(hueOf(null)).toBe(fallback);
    expect(hueOf(undefined)).toBe(fallback);
    expect(hueOf('')).toBe(fallback);
  });
});

describe('HUES', () => {
  it('holds the default, and holds each id and angle once', () => {
    expect(HUES).toContain(DEFAULT_HUE);
    expect(new Set(HUES.map((h) => h.id)).size).toBe(HUES.length);
    expect(new Set(HUES.map((h) => h.hue)).size).toBe(HUES.length);
  });

  /**
   * Only the hue rotates: chroma and lightness are fixed for every token, so
   * what a preset costs in contrast is decided by its angle alone. Measured on
   * the built page, `--primary` against white runs 3.16 at the cyans to 4.06 at
   * the magentas, the shipped violet sitting at 3.79. A preset below that would
   * read worse than the site already does, which is not a choice a reader
   * should be offered, so the presets stay in the two arcs that clear it.
   */
  it('keeps every preset at or above the default in light mode', () => {
    const clears = (hue: number) =>
      (hue >= 320 && hue <= 360) || (hue >= 0 && hue <= 60) || (hue >= 260 && hue <= 310);

    for (const { id, hue } of HUES) {
      expect(clears(hue), `${id} at ${hue} is in an arc that loses contrast`).toBe(true);
    }
  });
});
