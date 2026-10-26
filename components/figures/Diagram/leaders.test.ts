import { describe, expect, it } from 'vitest';

import { vec2 } from '@/lib/vec2';

import { leaderPath, stack } from './leaders';

describe('stack', () => {
  it('leaves names level with their targets when they have room', () => {
    expect(stack([10, 50, 90], 20, [0, 100])).toEqual([10, 50, 90]);
  });

  it('pushes crowded names apart, keeping them in the order of their targets', () => {
    const placed = stack([40, 30, 35], 20, [0, 200]);

    expect(placed[1]).toBeLessThan(placed[2]);
    expect(placed[2]).toBeLessThan(placed[0]);
    expect(placed[2] - placed[1]).toBeGreaterThanOrEqual(20);
    expect(placed[0] - placed[2]).toBeGreaterThanOrEqual(20);
  });

  it('pulls a crowd back inside the column when it would run off the end', () => {
    const placed = stack([95, 98, 99], 20, [0, 100]);

    expect(Math.max(...placed)).toBe(100);
    expect(placed).toEqual([60, 80, 100]);
  });

  it('keeps names off the top of the column', () => {
    expect(stack([-10, 0], 20, [5, 100])).toEqual([5, 25]);
  });
});

describe('leaderPath', () => {
  it('runs straight across when the name is level with its target', () => {
    expect(leaderPath(vec2(100, 40), vec2(200, 40))).toEqual([
      vec2(200, 40),
      vec2(100, 40),
    ]);
  });

  it('turns once, just short of the target, when the name had to move', () => {
    const [label, knee, target] = leaderPath(vec2(100, 40), vec2(200, 80));

    expect(label).toEqual(vec2(200, 80));
    expect(knee.y).toBe(80);
    expect(knee.x).toBeGreaterThan(100);
    expect(target).toEqual(vec2(100, 40));
  });
});
