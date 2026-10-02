import { fireEvent, render } from '@testing-library/react';
import Link from 'next/link';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';
import type { LinkMetadata } from '@/lib/link-preview';

import { LinkPreviews } from './LinkPreviews';
import { LINK_PREVIEW } from './states/link-preview';
import type { IslandContext } from './types';

const answer = vi.hoisted(() => vi.fn<() => Promise<LinkMetadata>>());
vi.mock('@/lib/link-preview/client', () => ({ askAbout: answer }));

const posts = {
  'shades-of-halftone': {
    title: 'Shades of Halftone',
    description: 'Dots on a grid.',
  },
};

const harness = () => (
  <>
    <LinkPreviews posts={posts} />
    <Link href="/posts/shades-of-halftone">
      the one with the <span>dots</span>
    </Link>
    <Link href="/glossary">the glossary</Link>
    <a href="https://example.com/a">a site</a>
  </>
);

const link = (container: HTMLElement, index: number) =>
  container.querySelectorAll('a')[index];

const previewing = () =>
  useIslandStore.getState().presented.some((state) => state.id === LINK_PREVIEW);

const point = (node: Element, relatedTarget: Element | null = null) =>
  fireEvent.pointerOver(node, { pointerType: 'mouse', relatedTarget, bubbles: true });

const leave = (node: Element, relatedTarget: Element | null = null) =>
  fireEvent.pointerOut(node, { pointerType: 'mouse', relatedTarget, bubbles: true });

/** What the island would draw, which is the only thing a preview is for. */
const shown = () => {
  const state = useIslandStore.getState().presented.at(-1);
  if (!state) return undefined;

  const { container, unmount } = render(<>{state.render({} as IslandContext)}</>);
  const text = container.textContent;
  unmount();

  return text;
};

beforeEach(() => {
  vi.useFakeTimers();
  answer.mockResolvedValue({});
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  useIslandStore.setState({ presented: [] });
});

describe('LinkPreviews', () => {
  it('names where a link leads, once the pointer has settled on it', () => {
    const { container } = render(harness());

    point(link(container, 0));
    expect(previewing()).toBe(false);

    vi.advanceTimersByTime(300);
    expect(previewing()).toBe(true);
  });

  it('gives the island back when the pointer moves off', () => {
    const { container } = render(harness());

    point(link(container, 0));
    vi.advanceTimersByTime(300);
    leave(link(container, 0));
    vi.advanceTimersByTime(200);

    expect(previewing()).toBe(false);
  });

  // The pointer crossing a link's own children must not restart the wait.
  it('reads moving within a link as staying on it', () => {
    const { container } = render(harness());
    const anchor = link(container, 0);
    const inner = anchor.querySelector('span')!;

    point(anchor);
    vi.advanceTimersByTime(200);
    point(inner, anchor);
    leave(anchor, inner);
    vi.advanceTimersByTime(100);

    expect(previewing()).toBe(true);
  });

  it('says nothing about a link it has nothing to add to', () => {
    const { container } = render(harness());

    point(link(container, 1));
    vi.advanceTimersByTime(300);

    expect(previewing()).toBe(false);
  });

  // A tap is a navigation, not a request to be told where it goes.
  it('ignores a touch', () => {
    const { container } = render(harness());

    fireEvent.pointerOver(link(container, 0), { pointerType: 'touch', bubbles: true });
    vi.advanceTimersByTime(300);

    expect(previewing()).toBe(false);
  });

  it('answers the keyboard as well as the pointer', () => {
    const { container } = render(harness());

    fireEvent.focusIn(link(container, 0), { bubbles: true });
    vi.advanceTimersByTime(300);
    expect(previewing()).toBe(true);

    fireEvent.focusOut(link(container, 0), { bubbles: true });
    vi.advanceTimersByTime(200);
    expect(previewing()).toBe(false);
  });

  it('shows what the URL said, then what the page says once it answers', async () => {
    answer.mockResolvedValue({ title: 'A Real Title', description: 'Said by the page.' });
    const { container } = render(harness());

    point(link(container, 2));
    vi.advanceTimersByTime(300);
    expect(shown()).toBe('example.com');

    await vi.runAllTimersAsync();
    expect(shown()).toContain('A Real Title');
    expect(shown()).toContain('Said by the page.');
  });

  // A card collapsing straight back drags its layout through the move. Stepping
  // through the bare pill leaves the last morph a change of width alone.
  it('steps down to a bare pill before letting the island go', async () => {
    answer.mockResolvedValue({ title: 'A Real Title', description: 'Said by the page.' });
    const { container } = render(harness());

    point(link(container, 2));
    await vi.advanceTimersByTimeAsync(300);
    expect(shown()).toContain('Said by the page.');

    leave(link(container, 2));

    expect(previewing()).toBe(true);
    expect(shown()).toBe('A Real Title');

    await vi.advanceTimersByTimeAsync(200);
    expect(previewing()).toBe(false);
  });

  // An answer that lands after the reader has moved on is an island changing by itself.
  it('drops an answer that arrives too late', async () => {
    answer.mockResolvedValue({ title: 'A Real Title' });
    const { container } = render(harness());

    point(link(container, 2));
    vi.advanceTimersByTime(300);
    leave(link(container, 2));
    await vi.runAllTimersAsync();

    expect(previewing()).toBe(false);
  });

  // It is already in hand: asking would only tell us what we built.
  it('asks nothing about a post of our own', () => {
    const { container } = render(harness());

    point(link(container, 0));
    vi.advanceTimersByTime(300);

    expect(answer).not.toHaveBeenCalled();
    expect(shown()).toContain('Shades of Halftone');
  });

  it('leaves nothing behind when it goes', () => {
    const { container, unmount } = render(harness());

    point(link(container, 0));
    vi.advanceTimersByTime(300);
    unmount();

    expect(previewing()).toBe(false);
  });
});
