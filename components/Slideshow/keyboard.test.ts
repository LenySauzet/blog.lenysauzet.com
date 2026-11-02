import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { keyFor, nearestToCentre, registerSlideshow, type SlideshowKey } from './keyboard';

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

  it('takes Home, End, Space and Enter only when the slideshow holds focus', () => {
    expect(keyFor(press('Home'), true)).toBe('first');
    expect(keyFor(press('End'), true)).toBe('last');
    expect(keyFor(press(' '), true)).toBe('toggle');
    expect(keyFor(press('Enter'), true)).toBe('open');
    for (const key of ['Home', 'End', ' ', 'Enter']) expect(keyFor(press(key), false)).toBeNull();
  });

  it('leaves any chord and any other key alone', () => {
    for (const modifier of ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'] as const)
      expect(keyFor(press('ArrowRight', { [modifier]: true }), true)).toBeNull();
    expect(keyFor(press('ArrowUp'), true)).toBeNull();
    expect(keyFor(press('Tab'), true)).toBeNull();
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

describe('registerSlideshow', () => {
  const mount = (top: number) => {
    const root = document.createElement('div');
    root.dataset.slideshow = '';
    root.tabIndex = 0;
    root.getBoundingClientRect = () => ({ top, bottom: top + 400, left: 0, right: 700 }) as DOMRect;
    const pause = document.createElement('button');
    root.append(pause);
    document.body.append(root);
    const keys: SlideshowKey[] = [];
    const unregister = registerSlideshow(root, (key) => (keys.push(key), true));
    return { root, pause, keys, unregister };
  };
  const press = (target: EventTarget, key: string, repeat = false) => {
    const event = new KeyboardEvent('keydown', { key, repeat, bubbles: true, cancelable: true });
    target.dispatchEvent(event);
    return event.defaultPrevented;
  };

  let near: ReturnType<typeof mount>;
  let far: ReturnType<typeof mount>;
  beforeEach(() => {
    window.innerHeight = 900;
    near = mount(250);
    far = mount(700);
  });
  afterEach(() => {
    near.unregister();
    far.unregister();
    document.body.replaceChildren();
  });

  it('sends a bare arrow to the slideshow nearest the middle of the screen', () => {
    expect(press(document.body, 'ArrowRight')).toBe(true);
    expect(near.keys).toEqual(['next']);
    expect(far.keys).toEqual([]);
  });

  it('leaves the arrows to a link, a dialog or anything else that owns them', () => {
    const link = Object.assign(document.createElement('a'), { href: '#x' });
    const dialog = document.createElement('div');
    dialog.setAttribute('role', 'dialog');
    document.body.append(link, dialog);
    expect(press(link, 'ArrowRight')).toBe(false);
    expect(press(dialog, 'ArrowLeft')).toBe(false);
    expect(near.keys).toEqual([]);
  });

  it('gives a focused slideshow its keys, Home, End and Space included', () => {
    far.root.focus();
    for (const key of ['ArrowLeft', 'Home', 'End', ' ']) press(far.root, key);
    expect(far.keys).toEqual(['previous', 'first', 'last', 'toggle']);
    expect(near.keys).toEqual([]);
  });

  it('lets a button inside take Space, while the arrows still move its slideshow', () => {
    far.pause.focus();
    expect(press(far.pause, ' ')).toBe(false);
    press(far.pause, 'ArrowRight');
    expect(far.keys).toEqual(['next']);
  });

  it('swallows a held Space without flipping playback again', () => {
    near.root.focus();
    expect(press(near.root, ' ', true)).toBe(true);
    expect(near.keys).toEqual([]);
  });

  it('stops listening once the last slideshow leaves', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    near.unregister();
    expect(remove).not.toHaveBeenCalled();
    far.unregister();
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function));
    remove.mockRestore();
    expect(press(document.body, 'ArrowRight')).toBe(false);
    expect([...near.keys, ...far.keys]).toEqual([]);
  });
});
