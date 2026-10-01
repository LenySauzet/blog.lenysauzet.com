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
  // without something to be. The name is drawn without its diacritic, deliberately.
  it('falls back to the identity', () => {
    render(<DynamicIsland />);

    expect(island()).toHaveTextContent('Leny');
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
  // article takes its surface back once the pointer is properly away. Away, and not
  // merely off the element: the hint is smaller than what it covers, so a pill that
  // un-hovered on its own edge would shrink out from under the pointer, grow back,
  // and oscillate. Leaving is a move past a margin, which is what this walks.
  it('shows the hint over the reading state, and gives it back', async () => {
    const user = userEvent.setup();
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    await user.hover(island());
    await waitFor(() => expect(island()).toHaveTextContent('to search'));

    await user.pointer({
      target: document.body,
      coords: { clientX: 500, clientY: 500 },
    });
    await waitFor(() => expect(island()).toHaveTextContent('Shades of Halftone'));
  });

  // The pointer resting just off the edge keeps the hint: anything else flickers.
  it('keeps the hint while the pointer is only just outside', async () => {
    const user = userEvent.setup();
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    await user.hover(island());
    await waitFor(() => expect(island()).toHaveTextContent('to search'));

    await user.pointer({ target: document.body, coords: { clientX: 8, clientY: 8 } });

    expect(island()).toHaveTextContent('to search');
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
    expect(island()).toHaveTextContent('Leny');

    await vi.advanceTimersByTimeAsync(1100);
    await waitFor(() => expect(island()).toHaveTextContent('to search'));

    await vi.advanceTimersByTimeAsync(4100);
    await waitFor(() => expect(island()).toHaveTextContent('Leny'));

    first.unmount();
    render(<DynamicIsland />);
    await vi.advanceTimersByTimeAsync(1100);

    expect(island()).toHaveTextContent('Leny');
  });

  it('opens the palette when it is pressed', async () => {
    const user = userEvent.setup();
    render(<DynamicIsland />);

    await user.click(island());

    expect(useCmdkStore.getState().isOpen).toBe(true);
  });
});
