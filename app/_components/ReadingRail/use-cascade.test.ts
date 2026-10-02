import { describe, expect, it } from 'vitest';

import { passDuration } from './use-cascade';

// Anything waiting for the rail to empty waits on this, so it has to grow with
// the count rather than sit at a figure picked for one post.
describe('passDuration', () => {
  it('grows by one beat per title beyond the first', () => {
    expect(passDuration(1)).toBeCloseTo(0.3);
    expect(passDuration(3)).toBeCloseTo(0.375);
    expect(passDuration(13)).toBeCloseTo(0.75);
  });

  it('is one fade for a rail with nothing to walk', () => {
    expect(passDuration(0)).toBeCloseTo(0.3);
  });
});
