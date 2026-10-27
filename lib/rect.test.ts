import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';

import { centre, rect } from './rect';

const BOX = rect(vec2(10, 20), 100, 40);

describe('a rectangle', () => {
  it('has its centre halfway across both sides', () => {
    expect(centre(BOX)).toEqual(vec2(60, 40));
  });
});
