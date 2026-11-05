import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZoomCaption } from './ZoomCaption';

// `vitest-setup` forces reduced motion, so only the still branch runs here.
describe('ZoomCaption', () => {
  it('renders the caption as one plain paragraph under reduced motion', () => {
    const { container } = render(
      <ZoomCaption start>Monet&apos;s Meadow with Poplars</ZoomCaption>
    );

    expect(container.querySelector('p')).toHaveTextContent(
      "Monet's Meadow with Poplars"
    );
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  it('is hidden from assistive tech', () => {
    const { container } = render(<ZoomCaption start>A caption</ZoomCaption>);

    expect(container.querySelector('p')).toHaveAttribute('aria-hidden', 'true');
    // By role, not by text: only role queries honour `aria-hidden`.
    expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
  });

  it('keeps the spacing of a multi-word caption', () => {
    const { container } = render(
      <ZoomCaption start>one two three four</ZoomCaption>
    );

    expect(container.querySelector('p')?.textContent).toBe('one two three four');
  });
});
