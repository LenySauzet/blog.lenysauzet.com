import { describe, expect, it } from 'vitest';

import { DEFOCUS_SECONDS, revealGeometry, SWEEP_SECONDS } from './reveal-geometry';

describe('revealGeometry', () => {
  const shapes: [string, number, number][] = [
    ['laptop', 720, 900],
    ['small laptop', 512, 768],
    ['desktop', 960, 1080],
    ['wider than tall', 1280, 900],
    ['ultrawide', 1720, 1440],
    ['tall and narrow', 512, 1400],
  ];

  it.each(shapes)('covers %s before it starts', (_name, width, height) => {
    expect(revealGeometry(width, height).coversPanel).toBe(true);
  });

  it.each(shapes)('shows nothing of %s on the first frame', (_name, width, height) => {
    expect(revealGeometry(width, height).hiddenAtStart).toBe(true);
  });

  it.each(shapes)('clears every corner of %s by the end', (_name, width, height) => {
    expect(revealGeometry(width, height).clearAtEnd).toBe(true);
  });
});

it('fades focus back in for longer than the sweep runs', () => {
  expect(DEFOCUS_SECONDS).toBeGreaterThan(SWEEP_SECONDS);
});
