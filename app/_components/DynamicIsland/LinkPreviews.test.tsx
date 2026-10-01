import { fireEvent, render } from '@testing-library/react';
import Link from 'next/link';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useIslandStore } from '@/hooks/use-island-store';

import { LinkPreviews } from './LinkPreviews';
import { LINK_PREVIEW } from './states/link-preview';

const posts = { 'shades-of-halftone': 'Shades of Halftone' };

const harness = () => (
  <>
    <LinkPreviews posts={posts} />
    <Link href="/posts/shades-of-halftone">
      the one with the <span>dots</span>
    </Link>
    <Link href="/glossary">the glossary</Link>
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

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  vi.useRealTimers();
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

  it('leaves nothing behind when it goes', () => {
    const { container, unmount } = render(harness());

    point(link(container, 0));
    vi.advanceTimersByTime(300);
    unmount();

    expect(previewing()).toBe(false);
  });
});
