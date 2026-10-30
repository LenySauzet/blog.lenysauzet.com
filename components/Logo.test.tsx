import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Logo from './Logo';

describe('Logo', () => {
  it('draws the full mark by default, and the 16-pixel one when small', () => {
    const { container, rerender } = render(<Logo />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 32 32');

    rerender(<Logo small />);
    expect(container.querySelector('svg')).toHaveAttribute('viewBox', '0 0 16 16');
  });

  it('is hidden from assistive tech without alt, the text beside it naming the site', () => {
    const { container } = render(<Logo />);

    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is an image named by its alt', () => {
    render(<Logo alt="Lény Sauzet" />);

    expect(screen.getByRole('img', { name: 'Lény Sauzet' })).toBeInTheDocument();
  });

  it('forwards className and SVG attributes', () => {
    const { container } = render(<Logo className="size-5" width={104} />);

    expect(container.querySelector('svg')).toHaveClass('size-5');
    expect(container.querySelector('svg')).toHaveAttribute('width', '104');
  });
});
