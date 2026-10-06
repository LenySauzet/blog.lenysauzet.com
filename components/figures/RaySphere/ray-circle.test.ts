import { describe, expect, it } from 'vitest';

import { normalize, vec2 } from '@/lib/vec2';

import { rayCircle } from './ray-circle';

const RIGHT = vec2(1, 0);
const CENTRE = vec2(10, 0);

describe('a ray against a circle', () => {
  it('crosses a circle it is aimed through', () => {
    const hit = rayCircle(vec2(0, 0), RIGHT, CENTRE, 2);

    expect(hit.hits).toBe(true);
    if (!hit.hits) return;
    expect(hit.near).toBeCloseTo(8);
    expect(hit.far).toBeCloseTo(12);
    expect(hit.closest).toBeCloseTo(10);
  });

  it('misses one it passes beside', () => {
    expect(rayCircle(vec2(0, 5), RIGHT, CENTRE, 2).hits).toBe(false);
  });

  /** A grazing ray is one root twice, which is the discriminant at zero. */
  it('touches a circle it grazes, entering and leaving at once', () => {
    const hit = rayCircle(vec2(0, 2), RIGHT, CENTRE, 2);

    expect(hit.hits).toBe(true);
    if (!hit.hits) return;
    expect(hit.near).toBeCloseTo(hit.far);
  });

  /** A ray, not a line: what is behind the origin was never in front of it. */
  it('misses a circle behind it', () => {
    expect(rayCircle(vec2(20, 0), RIGHT, CENTRE, 2).hits).toBe(false);
  });

  it('still reports the closest approach when it misses', () => {
    expect(rayCircle(vec2(0, 5), RIGHT, CENTRE, 2).closest).toBeCloseTo(10);
  });

  /** Inside, the near root is behind the origin and the far one is the way out. */
  it('leaves a circle it starts inside', () => {
    const hit = rayCircle(CENTRE, RIGHT, CENTRE, 2);

    expect(hit.hits).toBe(true);
    if (!hit.hits) return;
    expect(hit.near).toBeCloseTo(-2);
    expect(hit.far).toBeCloseTo(2);
  });

  it('is unchanged by the direction it is aimed from', () => {
    const slanted = normalize(vec2(3, 4));
    const hit = rayCircle(vec2(0, 0), slanted, vec2(30, 40), 5);

    expect(hit.hits).toBe(true);
    if (!hit.hits) return;
    expect(hit.closest).toBeCloseTo(50);
  });
});
