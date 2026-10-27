import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';

import { centre, edge, rect } from './rect';

const BOX = rect(vec2(10, 20), 100, 40);

describe('a rectangle', () => {
  it('has its centre halfway across both sides', () => {
    expect(centre(BOX)).toEqual(vec2(60, 40));
  });

  it('meets each side at its middle, pushed out by a gap', () => {
    expect(edge(BOX, 'top')).toEqual(vec2(60, 20));
    expect(edge(BOX, 'right', 4)).toEqual(vec2(114, 40));
    expect(edge(BOX, 'bottom', 4)).toEqual(vec2(60, 64));
    expect(edge(BOX, 'left', 4)).toEqual(vec2(6, 40));
  });
});
