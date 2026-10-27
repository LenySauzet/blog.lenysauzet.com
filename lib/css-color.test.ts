import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cssColor } from './css-color';

describe('cssColor', () => {
  let resolved = 'rgb(255, 0, 0)';
  let painted: string;

  beforeEach(() => {
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () => ({ color: resolved }) as CSSStyleDeclaration,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      set fillStyle(css: string) {
        painted = css;
      },
      fillRect: () => {},
      getImageData: () => ({ data: painted === 'rgb(255, 0, 0)' ? [255, 0, 0, 255] : [0, 0, 255, 255] }),
    } as unknown as CanvasRenderingContext2D);
  });

  afterEach(() => {
    resolved = 'rgb(255, 0, 0)';
  });

  it('reads the colour the token resolves to, as the page paints it', () => {
    expect(cssColor('--primary').read()).toEqual([1, 0, 0]);
  });

  it('hands back the same value until the token resolves differently', () => {
    const color = cssColor('--primary');
    const first = color.read();

    expect(color.read()).toBe(first);

    resolved = 'rgb(0, 0, 255)';
    expect(color.read()).not.toBe(first);
    expect(color.read()).toEqual([0, 0, 1]);
  });

  it('leaves nothing in the page once disposed', () => {
    const before = document.body.childElementCount;
    const color = cssColor('--primary');
    color.dispose();

    expect(document.body.childElementCount).toBe(before);
  });
});
