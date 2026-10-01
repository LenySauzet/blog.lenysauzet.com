import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { DynamicIsland } from './DynamicIsland';
import type { IslandState } from './types';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const island = () => screen.getByRole('button', { name: 'Open the command palette' });

/**
 * The island opens into a state rather than appearing as one: every change passes
 * through the resting shape, so what it settles on is what these assert.
 */
const settlesOn = (text: string) =>
  waitFor(() => expect(island()).toHaveTextContent(text));

/**
 * The island reads whichever column the route marks as scrolling, and jsdom lays
 * out nothing, so the column is stood up by hand and moved by hand.
 */
let column: HTMLElement;

const scrollDown = () => {
  Object.defineProperty(column, 'scrollTop', { value: 400, configurable: true });
  fireEvent.scroll(column);
};

beforeEach(() => {
  column = document.createElement('div');
  column.setAttribute('data-scroll-root', '');
  document.body.append(column);
});

afterEach(() => {
  column.remove();
  useIslandStore.setState({ presented: [], post: null });
  useCmdkStore.setState({ isOpen: false });
  pathname = '/';
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('DynamicIsland', () => {
  // The last state in the registry carries no condition, so the island is never
  // without something to be. The name is drawn without its diacritic, deliberately.
  it('falls back to the identity', async () => {
    render(<DynamicIsland />);

    await settlesOn('Leny');
  });

  it('reads the post it was handed, preferring the short title', async () => {
    useIslandStore.setState({
      post: { title: 'An Introduction to Ray Marching', shortTitle: 'Ray Marching' },
    });
    render(<DynamicIsland />);
    scrollDown();

    await settlesOn('Ray Marching');
    expect(island()).not.toHaveTextContent('An Introduction');
  });

  it('falls back to the full title when a post declares no short one', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    scrollDown();

    await settlesOn('Shades of Halftone');
  });

  // At the top of an article there is no progress worth reporting, so the island
  // introduces the site and gets out of the way as soon as it has something to say.
  it('introduces the site until the reader has started', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    await settlesOn('Leny');

    scrollDown();
    await settlesOn('Shades of Halftone');
  });

  // The resting shape is what a layout animation needs to grow from: on the first
  // paint there is no previous box, so the island arrived at full size having never
  // opened.
  it('starts at rest and opens into its state', () => {
    render(<DynamicIsland />);

    expect(island()).toHaveTextContent('');
    expect(island()).not.toHaveTextContent('Leny');
  });

  // Only the first change is staged. Passing every later one through rest as well
  // makes the island answer two tenths of a second late, which costs more than the
  // flourish is worth.
  it('goes straight between states once it has opened', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    await settlesOn('Leny');

    act(() => scrollDown());

    expect(island()).toHaveTextContent('Shades of Halftone');
  });

  // While the pointer rests on it the island answers "what can I do here", and the
  // article takes its surface back the moment it leaves. The zone is a box of its
  // own that no state resizes, which is what lets leaving simply mean leaving.
  it('shows the hint over the reading state, and gives it back', async () => {
    const user = userEvent.setup();
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    scrollDown();

    await user.hover(island());
    await waitFor(() => expect(island()).toHaveTextContent('to search'));

    await user.unhover(island());
    await waitFor(() => expect(island()).toHaveTextContent('Shades of Halftone'));
  });

  // The pill changes width with every state, so hover and click are hung on a box
  // that does not: the zone that raises the hint is learnable, and no state can
  // shrink out from under the pointer that raised it. That it holds its size is
  // geometry, which jsdom lays out none of, so it is measured in a browser.
  // The target is the pill exactly, which only works because nothing a pointer does
  // can resize it: the hint keeps the width of whatever it covers, so it cannot
  // shrink out from under the pointer that raised it.
  it('holds its width while the hint covers a state', async () => {
    const user = userEvent.setup();
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    scrollDown();
    await settlesOn('Shades of Halftone');

    const pill = island().firstElementChild as HTMLElement;
    // jsdom lays out nothing, so the width it holds is whatever was read on entry.
    Object.defineProperty(pill, 'offsetWidth', { value: 288, configurable: true });

    await user.hover(island());

    await waitFor(() => expect(island()).toHaveTextContent('to search'));
    expect(pill.style.width).toBe('288px');
  });

  // A raised state covers whatever the page was saying, and on dismissal uncovers
  // it: a reader three quarters through an article finds their place again.
  it('lets a raised state cover the page, then uncovers it', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    scrollDown();

    const announcement: IslandState = {
      id: 'announcement',
      render: () => <span>Link copied</span>,
    };
    useIslandStore.getState().present(announcement);
    await waitFor(() => expect(island()).toHaveTextContent('Link copied'));

    useIslandStore.getState().dismiss('announcement');
    await waitFor(() => expect(island()).toHaveTextContent('Shades of Halftone'));
  });

  it('mentions the palette on load, once the identity has been read', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    render(<DynamicIsland />);
    await settlesOn('Leny');

    await vi.advanceTimersByTimeAsync(1200);
    await settlesOn('to search');

    // And leaves on its own, uncovering whatever the page was saying.
    await vi.advanceTimersByTimeAsync(1800);
    await settlesOn('Leny');
  });

  it('opens the palette when it is pressed', async () => {
    const user = userEvent.setup();
    render(<DynamicIsland />);

    await user.click(island());

    expect(useCmdkStore.getState().isOpen).toBe(true);
  });
});
