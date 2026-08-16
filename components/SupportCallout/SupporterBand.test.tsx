import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SupporterBand from './SupporterBand';

const answer = (body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => body })
  );

afterEach(() => vi.unstubAllGlobals());

describe('SupporterBand', () => {
  it('lists the supporters it was given', async () => {
    answer({
      supporters: [{ name: 'Mateo Rossi', amount: 33, currency: 'EUR' }],
      total: 1284,
    });
    render(<SupporterBand />);

    expect(await screen.findAllByText('Mateo Rossi')).not.toHaveLength(0);
    expect(screen.getAllByText('€33')).not.toHaveLength(0);
  });

  // The count is everyone who ever gave, not the handful on screen.
  it('shows the reported total, not the number of rows', async () => {
    answer({
      supporters: [{ name: 'Ingrid Holm', amount: 18, currency: 'EUR' }],
      total: 1284,
    });
    render(<SupporterBand />);

    await screen.findAllByText('Ingrid Holm');
    expect(screen.getByText('1 284')).toBeInTheDocument();
  });

  // A missing token or an outage answers with an empty list, and the card above keeps
  // its copy and buttons. An empty strip would read as broken.
  it('renders nothing at all when there is no one to show', async () => {
    answer({ supporters: [], total: 0 });
    const { container } = render(<SupporterBand />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  it('renders nothing when the request itself fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    const { container } = render(<SupporterBand />);

    await waitFor(() => expect(container).toBeEmptyDOMElement());
  });

  // The second copy exists so the list can wrap without a gap; a screen reader should
  // hear the names once.
  it('hides the duplicated copy from assistive tech', async () => {
    answer({
      supporters: [{ name: 'Amara Okafor', amount: 48, currency: 'EUR' }],
      total: 3,
    });
    render(<SupporterBand />);

    expect(await screen.findAllByText('Amara Okafor')).toHaveLength(2);
    expect(document.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(1);
  });

  // The stop itself is a spring settling over time, and jsdom animates nothing. What
  // is assertable is the intent: pointing at the band asks it to stop, leaving asks it
  // to resume.
  it('asks the scroll to stop while the pointer is over it', async () => {
    const user = userEvent.setup();
    answer({
      supporters: [{ name: 'Leo Marchetti', amount: 12, currency: 'EUR' }],
      total: 9,
    });
    render(<SupporterBand />);

    await screen.findAllByText('Leo Marchetti');
    const scroller = document.querySelector<HTMLElement>(
      '[data-slot=supporter-scroller]'
    )!;
    expect(scroller).not.toHaveAttribute('data-paused');

    await user.hover(scroller);
    expect(scroller).toHaveAttribute('data-paused');

    await user.unhover(scroller);
    expect(scroller).not.toHaveAttribute('data-paused');
  });
});
