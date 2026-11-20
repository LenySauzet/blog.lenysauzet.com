import { describe, expect, it } from 'vitest';

import { isFinished, readProgress } from './use-scroll-tracking';

describe('readProgress', () => {
  it('is the share of the room scrolled, capped at the end', () => {
    expect(readProgress(1000, 0)).toBe(0);
    expect(readProgress(1000, 250)).toBe(0.25);
    expect(readProgress(1000, 1200)).toBe(1);
  });

  it('counts a page with no room to scroll as read to its end', () => {
    expect(isFinished(readProgress(0, 0))).toBe(true);
    expect(isFinished(readProgress(-40, 0))).toBe(true);
  });

  it('finishes just short of the very end', () => {
    expect(isFinished(readProgress(1000, 979))).toBe(false);
    expect(isFinished(readProgress(1000, 980))).toBe(true);
  });
});
