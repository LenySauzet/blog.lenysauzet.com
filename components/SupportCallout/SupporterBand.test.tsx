import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import SupporterBand, { repeatsToFill } from './SupporterBand';

const answer = (body: unknown) =>
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => body })
  );

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

  // Everyone who ever gave, not the handful on screen.
  it('shows the reported total, not the number of rows', async () => {
    answer({
      supporters: [{ name: 'Ingrid Holm', amount: 18, currency: 'EUR' }],
      total: 1284,
    });
    render(<SupporterBand />);

    await screen.findAllByText('Ingrid Holm');
    expect(screen.getByText('1 284')).toBeInTheDocument();
  });

  // The card above keeps its copy and buttons; an empty strip would read as broken.
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

  // A frozen window of repeated names reads as a duplication bug, so the whole
  // apparatus goes, leaving the plain list.
  it('drops the loop and its apparatus under reduced motion', async () => {
    answer({
      supporters: [{ name: 'Amara Okafor', amount: 48, currency: 'EUR' }],
      total: 3,
    });
    render(<SupporterBand />);

    expect(await screen.findAllByText('Amara Okafor')).toHaveLength(1);
    const scroller = document.querySelector<HTMLElement>(
      '[data-slot=supporter-scroller]'
    )!;
    expect(scroller).toHaveAttribute('data-still');
    // Nothing hidden from a screen reader, because nothing is a duplicate.
    expect(document.querySelectorAll('li[aria-hidden="true"]')).toHaveLength(0);
    // Nothing to pause means no tab stop: the stop exists only to stop the scroll.
    expect(scroller).not.toHaveAttribute('tabindex');
    expect(scroller).not.toHaveAttribute('role');
  });
});

/**
 * The scrolling half is unreachable here: `vitest-setup` forces `prefers-reduced-motion`
 * and Motion caches that at module scope, so no per-test stub undoes it. The loop, the
 * pause and the wrap are checked in a browser. The arithmetic is what survives as a unit,
 * and it is the part that has actually broken.
 */
describe('repeatsToFill', () => {
  it('repeats a lone supporter until the five-name window is covered', () => {
    expect(repeatsToFill(1)).toBe(5);
  });

  it('rounds up rather than leaving a sliver uncovered', () => {
    expect(repeatsToFill(3)).toBe(2);
  });

  it('leaves a list that already covers alone', () => {
    expect(repeatsToFill(5)).toBe(1);
    expect(repeatsToFill(40)).toBe(1);
  });

  // The failure that started this: an input derived from the output ran away to 317.
  it('covers the window without ever drawing a repeat too many', () => {
    for (const count of [1, 2, 3, 4, 5, 6, 40]) {
      const repeats = repeatsToFill(count);
      expect(repeats * count).toBeGreaterThanOrEqual(5);
      expect((repeats - 1) * count).toBeLessThan(5);
    }
  });

  it.each([0, -3, Number.NaN])('falls back to a single pass for %p', (count) => {
    expect(repeatsToFill(count)).toBe(1);
  });
});
