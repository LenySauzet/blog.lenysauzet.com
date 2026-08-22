import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ZoomCaption } from './ZoomCaption';

// `vitest-setup` forces `prefers-reduced-motion`, so this file only ever exercises the
// still branch. The cascade itself is measured in a browser.
describe('ZoomCaption', () => {
  it('renders the caption as one plain paragraph under reduced motion', () => {
    const { container } = render(
      <ZoomCaption start>Monet&apos;s Meadow with Poplars</ZoomCaption>
    );

    expect(container.querySelector('p')).toHaveTextContent(
      "Monet's Meadow with Poplars"
    );
    // No per-word split to animate, so no spans to leave behind.
    expect(container.querySelectorAll('span')).toHaveLength(0);
  });

  // The lightbox is already named by the same text, so announcing it again — and in
  // pieces, once it is split into words — would only repeat it.
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
