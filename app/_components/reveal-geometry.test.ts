import { describe, expect, it } from 'vitest';

import { DEFOCUS_SECONDS, revealGeometry, SWEEP_SECONDS } from './reveal-geometry';

// The circle, its travel and its falloff are four numbers holding three invariants
// between them, and two of those broke in a browser before they were written down: a
// layer edge landing inside the panel drew a straight seam, and sizing off viewport
// height alone left a corner uncovered on a screen wider than tall.
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

  // The corner the rim reaches last. Missing it leaves a permanently washed patch,
  // since the layer unmounts where the travel ends.
  it.each(shapes)('clears every corner of %s by the end', (_name, width, height) => {
    expect(revealGeometry(width, height).clearAtEnd).toBe(true);
  });
});

// The defocus carries the unmount, which only holds while it is the longer of the two:
// shorten it past the sweep and the layer leaves mid-reveal.
it('fades focus back in for longer than the sweep runs', () => {
  expect(DEFOCUS_SECONDS).toBeGreaterThan(SWEEP_SECONDS);
});
