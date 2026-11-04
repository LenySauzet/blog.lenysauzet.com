import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';

import { pathOf, tenth } from './path';

describe('a path', () => {
  it('writes a tenth of a unit, dropping a trailing zero and any negative zero', () => {
    expect([tenth(12.34), tenth(5), tenth(-0.04)]).toEqual(['12.3', '5', '0']);
  });

  it('joins every line into one path, closing each when asked', () => {
    expect(pathOf([[vec2(0, 0), vec2(1.25, -3)], [], [vec2(2, 2)]], true)).toBe('M0 0L1.3 -3ZM2 2Z');
  });
});
