import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import Details from './Details';

describe('Details', () => {
  it('is a disclosure: collapsed by default, expands on click', async () => {
    const user = userEvent.setup();
    render(
      <Details summary="Summary: Some short text">
        <p>Nested content</p>
      </Details>
    );

    const trigger = screen.getByRole('button', { name: /some short text/i });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Nested content')).not.toBeInTheDocument();

    await user.click(trigger);

    // Assert the disclosure state on the trigger, not the content's unmount:
    // jsdom's zero-sized boxes keep Motion's exit from ever settling.
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('honours defaultOpen', () => {
    render(
      <Details summary="s" defaultOpen>
        <p>Open from the start</p>
      </Details>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Open from the start')).toBeInTheDocument();
  });
});
