import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import GradualBlur from './GradualBlur';

// This component styles itself inline rather than with Tailwind classes, so
// jsdom can read back what it computed. One catch: jsdom keeps backdrop-filter
// on the CSSOM object but drops it from the serialised style attribute, so
// layers are selected by data-slot rather than by that property.
const root = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="gradual-blur"]')!;
const layers = (c: HTMLElement) =>
  Array.from(root(c).querySelectorAll<HTMLElement>('[data-slot="gradual-blur-layer"]'));
const blurOf = (el: HTMLElement) =>
  Number(el.style.backdropFilter.match(/blur\(([\d.]+)rem\)/)?.[1]);

describe('GradualBlur', () => {
  it('renders one layer per divCount', () => {
    const { container } = render(<GradualBlur divCount={7} />);

    expect(layers(container)).toHaveLength(7);
  });

  it('ramps the blur across the layers', () => {
    const { container } = render(<GradualBlur divCount={4} strength={2} />);
    const values = layers(container).map(blurOf);

    expect(values).toHaveLength(4);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
    expect(values[0]).toBeLessThan(values[3]);
  });

  it('ramps harder when exponential', () => {
    const linear = render(<GradualBlur divCount={5} />).container;
    const exponential = render(<GradualBlur divCount={5} exponential />).container;

    const last = (c: HTMLElement) => blurOf(layers(c)[4]);
    expect(last(exponential)).toBeGreaterThan(last(linear));
  });

  it('points the mask along the position', () => {
    const { container } = render(<GradualBlur position="left" />);

    expect(layers(container)[0].style.maskImage).toContain('to left');
  });

  it('is hidden from assistive tech, being decorative', () => {
    const { container } = render(<GradualBlur />);

    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
  });

  it('does not swallow pointer events unless it reacts to hover', () => {
    const plain = render(<GradualBlur />).container;
    const hoverable = render(<GradualBlur hoverIntensity={2} />).container;

    expect(root(plain).style.pointerEvents).toBe('none');
    expect(root(hoverable).style.pointerEvents).toBe('auto');
  });

  describe('presets', () => {
    it('applies the preset', () => {
      const { container } = render(<GradualBlur preset="page-footer" />);
      const el = root(container);

      expect(el.style.position).toBe('fixed');
      expect(el.style.bottom).toBe('0px');
      expect(el.style.height).toBe('10rem');
    });

    it('lets an explicit prop win over the preset', () => {
      const { container } = render(<GradualBlur preset="page-footer" height="2rem" />);

      expect(root(container).style.height).toBe('2rem');
    });

    it('stays under the Dock by default', () => {
      const { container } = render(<GradualBlur preset="page-footer" />);

      // The Dock sits at z-50 and the Lightbox at z-100; upstream defaulted to
      // 1000, which painted over both.
      expect(Number(root(container).style.zIndex)).toBeLessThan(50);
    });
  });
});
