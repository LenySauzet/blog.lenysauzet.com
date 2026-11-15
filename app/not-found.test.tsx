import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import NotFound from './not-found';

describe('NotFound', () => {
  it('says the page does not exist and leads back home', () => {
    render(<NotFound />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('This page does not exist');
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });

  // The status is drawn twice for its outline; only one copy may reach a screen reader.
  it('names its status once to assistive tech', () => {
    render(<NotFound />);

    const read = screen.getAllByText('404').filter((node) => !node.closest('[aria-hidden]'));
    expect(read).toHaveLength(1);
  });
});
