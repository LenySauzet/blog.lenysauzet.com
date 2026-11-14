import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ScrollFade from './ScrollFade';

const root = (c: HTMLElement) =>
  c.querySelector<HTMLElement>('[data-slot="scroll-fade"]')!;

describe('ScrollFade', () => {
  it('is decorative and never intercepts clicks', () => {
    const { container } = render(<ScrollFade />);

    expect(root(container)).toHaveAttribute('aria-hidden', 'true');
    expect(root(container).className).toContain('pointer-events-none');
  });

  it('fades a blur and a flat fill through the same mask, never a colour gradient', () => {
    const { container } = render(<ScrollFade />);
    const [blurLayer, colourLayer] = Array.from(root(container).children);
    const mask = '[mask-image:linear-gradient(to_top,black,transparent)]';

    expect(blurLayer.className).toContain('backdrop-blur-[4px]');
    expect(blurLayer.className).toContain(mask);
    expect(colourLayer.className).toContain('bg-background');
    expect(colourLayer.className).toContain(mask);
  });
});
