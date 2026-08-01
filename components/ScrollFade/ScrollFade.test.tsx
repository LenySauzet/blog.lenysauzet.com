import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ScrollFade from './ScrollFade';

const root = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="scroll-fade"]')!;
const layers = (c: HTMLElement) =>
  Array.from(root(c).children) as HTMLElement[];

describe('ScrollFade', () => {
  it('is decorative and never intercepts clicks', () => {
    const { container } = render(<ScrollFade />);

    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container).className).toContain('pointer-events-none');
  });

  it('stacks a blur layer and a colour layer', () => {
    const { container } = render(<ScrollFade />);
    const [blurLayer, colourLayer] = layers(container);

    expect(blurLayer.style.backdropFilter).toBe('blur(8px)');
    expect(colourLayer.style.background).toContain('var(--background)');
  });

  // The blur is ramped by a mask; without it the band would be a hard-edged
  // blurred rectangle rather than a dissolve.
  it('ramps the blur with a mask instead of a hard edge', () => {
    const { container } = render(<ScrollFade />);

    expect(layers(container)[0].style.maskImage).toContain('to top');
  });

  // `transparent` resolves to rgba(0,0,0,0), which draws a grey band across the
  // fade. The colour stop has to keep the background's own channels.
  it('fades to a transparent background colour, not to `transparent`', () => {
    const { container } = render(<ScrollFade />);
    const background = layers(container)[1].style.background;

    expect(background).toContain('oklch(from var(--background)');
    expect(background).not.toMatch(/,\s*transparent/);
  });

  it('takes its height and blur from props', () => {
    const { container } = render(<ScrollFade height="12rem" blur="20px" />);

    expect(root(container).style.height).toBe('12rem');
    expect(layers(container)[0].style.backdropFilter).toBe('blur(20px)');
  });

  // Both gradients run from the clinging edge inward, so they have to flip
  // together with it. Flipping one and not the other would blur the wrong end.
  describe('position', () => {
    it('clings to the bottom and runs upward by default', () => {
      const { container } = render(<ScrollFade />);
      const [blurLayer, colourLayer] = layers(container);

      expect(root(container).className).toContain('bottom-0');
      expect(blurLayer.style.maskImage).toContain('to top');
      expect(colourLayer.style.background).toContain('to top');
    });

    it('clings to the top and runs downward', () => {
      const { container } = render(<ScrollFade position="top" />);
      const [blurLayer, colourLayer] = layers(container);

      expect(root(container).className).toContain('top-0');
      expect(blurLayer.style.maskImage).toContain('to bottom');
      expect(colourLayer.style.background).toContain('to bottom');
    });
  });
});
