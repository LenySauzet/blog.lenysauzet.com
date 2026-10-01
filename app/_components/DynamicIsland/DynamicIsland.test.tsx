import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useCmdkStore } from '@/hooks/use-cmdk-store';
import { useIslandStore } from '@/hooks/use-island-store';

import { DynamicIsland } from './DynamicIsland';
import { announce } from './states/announcement';
import type { IslandState } from './types';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));

const island = () => screen.getByRole('button', { name: 'Open the command palette' });

const settlesOn = (text: string) =>
  waitFor(() => expect(island()).toHaveTextContent(text));

const pastTheGreeting = async () => {
  await vi.advanceTimersByTimeAsync(5200);
};

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

  it('introduces the site until the reader has started', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);

    await settlesOn('Leny');

    scrollDown();
    await settlesOn('Shades of Halftone');
  });

  it('starts at rest and opens into its state', () => {
    render(<DynamicIsland />);

    expect(island()).toHaveTextContent('');
    expect(island()).not.toHaveTextContent('Leny');
  });

  it('goes straight between states once it has opened', async () => {
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    await settlesOn('Leny');

    act(() => scrollDown());

    expect(island()).toHaveTextContent('Shades of Halftone');
  });

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

  it('never shrinks below the state the hint covers', async () => {
    const user = userEvent.setup();
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    scrollDown();
    await settlesOn('Shades of Halftone');

    const pill = island().firstElementChild as HTMLElement;
    Object.defineProperty(pill, 'offsetWidth', { value: 288, configurable: true });

    await user.hover(island());

    await waitFor(() => expect(island()).toHaveTextContent('to search'));
    expect(pill.style.minWidth).toBe('288px');
  });

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

    await vi.advanceTimersByTimeAsync(2000);
    await settlesOn('to search');

    await vi.advanceTimersByTimeAsync(3200);
    await settlesOn('Leny');
  });

  it('carries what a command announces, then gives the page back', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    useIslandStore.setState({ post: { title: 'Shades of Halftone' } });
    render(<DynamicIsland />);
    scrollDown();
    await pastTheGreeting();
    await settlesOn('Shades of Halftone');

    act(() => announce('Link copied'));
    await settlesOn('Link copied');

    await vi.advanceTimersByTimeAsync(3000);
    await settlesOn('Shades of Halftone');
  });

  it('renews an announcement raised again rather than stacking it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(<DynamicIsland />);
    await pastTheGreeting();
    await settlesOn('Leny');

    act(() => announce('Link copied'));
    await vi.advanceTimersByTimeAsync(2000);
    act(() => announce('Downloading my resume'));
    await settlesOn('Downloading my resume');

    await vi.advanceTimersByTimeAsync(1000);
    expect(island()).toHaveTextContent('Downloading my resume');
  });

  it('animates scale itself, which Tailwind v4 keeps apart from transform', () => {
    render(<DynamicIsland />);

    expect(island()).toHaveClass('transition-[scale]');
    expect(island()).toHaveClass('hover:scale-[1.02]');
    expect(island()).toHaveClass('active:scale-[0.97]');
  });

  it('opens the palette when it is pressed', async () => {
    const user = userEvent.setup();
    render(<DynamicIsland />);

    await user.click(island());

    expect(useCmdkStore.getState().isOpen).toBe(true);
  });
});
