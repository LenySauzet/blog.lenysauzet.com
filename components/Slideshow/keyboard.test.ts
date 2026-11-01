import { describe, expect, it } from 'vitest';

import { keyFor, nearestToCentre } from './keyboard';

const press = (key: string, modifiers: Partial<Record<'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey', boolean>> = {}) => ({
  key,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  ...modifiers,
});

describe('keyFor', () => {
  it('takes the arrows from anywhere', () => {
    for (const focused of [true, false]) {
      expect(keyFor(press('ArrowLeft'), focused)).toBe('previous');
      expect(keyFor(press('ArrowRight'), focused)).toBe('next');
    }
  });

  it('takes Home, End and Space only when the slideshow holds focus', () => {
    expect(keyFor(press('Home'), true)).toBe('first');
    expect(keyFor(press('End'), true)).toBe('last');
    expect(keyFor(press(' '), true)).toBe('toggle');
    for (const key of ['Home', 'End', ' ']) expect(keyFor(press(key), false)).toBeNull();
  });

  it('leaves any chord and any other key alone', () => {
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const)
      expect(keyFor(press('ArrowRight', { [modifier]: true }), true)).toBeNull();
    expect(keyFor(press('ArrowUp'), true)).toBeNull();
    expect(keyFor(press('Enter'), true)).toBeNull();
  });
});

describe('nearestToCentre', () => {
  const box = (top: number, bottom: number, left = 0, right = 700) => ({ top, bottom, left, right });

  it('picks the box whose middle is nearest the viewport middle', () => {
    expect(nearestToCentre([box(-200, 200), box(300, 700)], 1280, 900)).toBe(1);
    expect(nearestToCentre([box(100, 500), box(600, 1000)], 1280, 900)).toBe(0);
  });

  it('ignores a box off screen, however near its middle', () => {
    expect(nearestToCentre([box(-1000, -10), box(800, 1200)], 1280, 900)).toBe(1);
    expect(nearestToCentre([box(300, 600, -800, -10)], 1280, 900)).toBe(-1);
    expect(nearestToCentre([box(900, 1300)], 1280, 900)).toBe(-1);
    expect(nearestToCentre([box(-100, -1), box(850, 1250)], 1280, 900)).toBe(1);
  });

  it('finds nothing in an empty page', () => {
    expect(nearestToCentre([], 1280, 900)).toBe(-1);
  });
});
