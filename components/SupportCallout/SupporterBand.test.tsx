import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SupporterBand from './SupporterBand';

const answer = (body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => body })
  );

/**
 * jsdom reports 0 for every measured box, so the repeat count can only be exercised by
 * feeding it a row height.
 */
const withRowHeight = (height: number) => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockReturnValue(height);
  // The shared setup stubs ResizeObserver as an inert no-op, so the band would never be
  // told to measure at all. This one calls back, which is what `observe` really does.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      constructor(private readonly notify: () => void) {}
      observe() {
        this.notify();
      }
      unobserve() {}
      disconnect() {}
    }
  );
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

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

  // The band loops from the first donation on, so the list is always drawn twice even
  // when a single name is all there is.
  it('always draws a second copy, and announces only the first', async () => {
    answer({
      supporters: [{ name: 'Amara Okafor', amount: 48, currency: 'EUR' }],
      total: 3,
    });
    render(<SupporterBand />);

    expect(await screen.findAllByText('Amara Okafor')).toHaveLength(2);
    expect(document.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(1);
  });

  // A copy shorter than the window would tear a gap open on every wrap, so a short list
  // repeats inside each copy until it covers.
  it('repeats a short list until a copy covers the window', async () => {
    // One 20px row against a 176px window: 9 repeats, drawn twice.
    withRowHeight(20);
    answer({
      supporters: [{ name: 'Amara Okafor', amount: 48, currency: 'EUR' }],
      total: 3,
    });
    render(<SupporterBand />);

    // The repeats arrive on the render after the measurement, so this waits for them
    // rather than for the first name to appear.
    await waitFor(() =>
      expect(screen.getAllByText('Amara Okafor')).toHaveLength(18)
    );
    // However many times it is drawn, a screen reader hears the name once.
    expect(document.querySelectorAll('li:not([aria-hidden])')).toHaveLength(1);
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
