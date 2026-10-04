import { describe, expect, it } from 'vitest';

import { CHANNELS, reflectanceAt, spectrum } from './reflectance';

describe('reflectanceAt', () => {
  it('passes through every measured point rather than near it', () => {
    for (const [nm, value] of CHANNELS.green) {
      expect(reflectanceAt(CHANNELS.green, nm)).toBeCloseTo(value, 10);
    }
  });

  it('holds the end values outside the measured range', () => {
    expect(reflectanceAt(CHANNELS.blue, 300)).toBe(CHANNELS.blue[0][1]);
    expect(reflectanceAt(CHANNELS.blue, 900)).toBe(CHANNELS.blue.at(-1)![1]);
  });

  /** A spline can overshoot between two close readings, and a reflectance
      above one is not a reading. */
  it('never leaves zero to one, however the spline swings', () => {
    for (const points of Object.values(CHANNELS)) {
      for (let nm = 400; nm <= 700; nm += 1) {
        const value = reflectanceAt(points, nm);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('spectrum', () => {
  it('samples the whole visible range at the step it is given', () => {
    const rows = spectrum(10);
    expect(rows[0].nm).toBe(400);
    expect(rows.at(-1)!.nm).toBe(700);
    expect(rows).toHaveLength(31);
  });

  /**
   * Three primaries together cover the whole visible range, which is what
   * makes their sum white: the result saturates everywhere and the figure
   * teaches nothing until a channel is switched off. Measured here so a
   * change to the readings that broke that coverage would be caught.
   */
  it('has the three channels covering the range between them', () => {
    const sums = spectrum(5).map((r) => r.red + r.green + r.blue);
    expect(Math.min(...sums)).toBeGreaterThanOrEqual(100);
  });

  /** And switching one off opens the gap the figure is actually about. */
  it('opens a trough in the green band once green is off', () => {
    const rows = spectrum(5);
    const withoutGreen = rows.map((r) => ({ nm: r.nm, total: r.red + r.blue }));
    const band = withoutGreen.filter(({ nm }) => nm >= 520 && nm <= 560);

    expect(Math.max(...band.map((s) => s.total))).toBeLessThan(50);
    expect(withoutGreen.find((s) => s.nm === 400)!.total).toBeGreaterThan(95);
  });
});
