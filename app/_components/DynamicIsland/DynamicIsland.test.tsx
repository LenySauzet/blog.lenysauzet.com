import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { DynamicIsland } from './DynamicIsland';
import type { IslandState } from './types';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const island = () => screen.getByRole('button', { name: 'Open the command palette' });

beforeEach(() => {
  sessionStorage.clear();
  // Every case but the teaching one starts from a session that has already been
  // taught, or a timer fires into the middle of it.
  sessionStorage.setItem('island-hint-seen', '1');
});

afterEach(() => {
  useIslandStore.setState({ presented: [], post: null });
  useCmdkStore.setState({ isOpen: false });
  pathname = '/';
  vi.clearAllMocks();
  vi.useRealTimers();
});

describe('DynamicIsland', () => {
  // The last state in the registry carries no condition, so the island is never
  // without something to be.
  it('falls back to the identity', () => {
    render(<DynamicIsland />);

    expect(island()).toHaveTextContent('Lény Sauzet');
  });

  it('reads the post it was handed, preferring the short title', () => {
    useIslandStore.setState({
      post: { title: 'An Introduction to Ray Marching', shortTitle: 'Ray Marching' },
    });
    render(<DynamicIsland />);

    expect(island()).toHaveTextContent('Ray Marching');
    expect(island()).not.toHaveTextContent('An Introduction');
  });

  it('falls back to the full title when a post declares no short one', () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    expect(island()).toHaveTextContent('Shades of Halftone');
  });

  // While the pointer rests on it the island answers "what can I do here", and the
  // article takes its surface back the moment it leaves.
  it('shows the hint over the reading state, and gives it back', async () => {
    const user = userEvent.setup();
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    await user.hover(island());
    await waitFor(() => expect(island()).toHaveTextContent('to search'));

    await user.unhover(island());
    await waitFor(() => expect(island()).toHaveTextContent('Shades of Halftone'));
  });

  // A raised state covers whatever the page was saying, and on dismissal uncovers
  // it: a reader three quarters through an article finds their place again.
  it('lets a raised state cover the page, then uncovers it', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    const announcement: IslandState = {
      id: 'announcement',
      render: () => <span>Link copied</span>,
    };
    useIslandStore.getState().present(announcement);
    await waitFor(() => expect(island()).toHaveTextContent('Link copied'));

    useIslandStore.getState().dismiss('announcement');
    await waitFor(() => expect(island()).toHaveTextContent('Shades of Halftone'));
  });

  it('teaches the palette once a session, then stops', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    sessionStorage.clear();

    const first = render(<DynamicIsland />);
    expect(island()).toHaveTextContent('Lény Sauzet');

    await vi.advanceTimersByTimeAsync(1100);
    await waitFor(() => expect(island()).toHaveTextContent('to search'));

    await vi.advanceTimersByTimeAsync(4100);
    await waitFor(() => expect(island()).toHaveTextContent('Lény Sauzet'));

    first.unmount();
    render(<DynamicIsland />);
    await vi.advanceTimersByTimeAsync(1100);

    expect(island()).toHaveTextContent('Lény Sauzet');
  });

  it('opens the palette when it is pressed', async () => {
    const user = userEvent.setup();
    render(<DynamicIsland />);

    await user.click(island());

    expect(useCmdkStore.getState().isOpen).toBe(true);
  });
});
