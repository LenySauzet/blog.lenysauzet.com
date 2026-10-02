'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { useIslandStore } from '@/hooks/use-island-store';
import {
  askAbout,
  enrich,
  resolveLinkPreview,
  worthAsking,
  type KnownPosts,
} from '@/lib/link-preview';

import { collapsing, linkPreview, LINK_PREVIEW } from './states/link-preview';
import type { LinkPreview } from '@/lib/link-preview';

const DWELL = 260;

/** Long enough for the box to have all but arrived at the resting shape. */
const COLLAPSE = 240;

const anchorOf = (node: EventTarget | null) =>
  node instanceof Element ? node.closest('a[href]') : null;

export function LinkPreviews({ posts }: { posts: KnownPosts }) {
  const pathname = usePathname();

  useEffect(() => {
    // The index already names every post beside its date, so a card there repeats
    // what the reader is looking at, over the list it is repeating.
    if (pathname === '/') return;

    let opening: number | undefined;
    let closing: number | undefined;
    let pointed: string | undefined;
    const raise = (preview: LinkPreview) =>
      useIslandStore.getState().present(linkPreview(preview));

    const show = (anchor: Element) => {
      const href = anchor.getAttribute('href') ?? '';
      const preview = resolveLinkPreview(href, posts);
      if (!preview) return;

      window.clearTimeout(closing);
      window.clearTimeout(opening);
      pointed = href;

      // Asked for at once and shown after the wait, so the answer is often already
      // in hand by the time the island opens at all.
      const asked = worthAsking(href) ? askAbout(href) : undefined;

      opening = window.setTimeout(() => {
        raise(preview);

        // The island keeps what the URL alone said until the page answers, and
        // keeps it for good if the answer lands after the reader has moved on.
        asked?.then((metadata) => {
          if (pointed === href) raise(enrich(href, preview, metadata));
        });
      }, DWELL);
    };

    // Left to run out, the grace period is what carries the island from one link
    // to the next without dropping back to what it was showing in between.
    const hide = () => {
      window.clearTimeout(opening);
      pointed = undefined;

      const island = useIslandStore.getState();
      const current = island.presented.find((state) => state.id === LINK_PREVIEW);
      if (!current) return;

      island.present(collapsing(current.radius));
      closing = window.setTimeout(() => island.dismiss(LINK_PREVIEW), COLLAPSE);
    };

    const crossed = (event: PointerEvent | FocusEvent) => {
      const anchor = anchorOf(event.target);
      return anchor && anchor !== anchorOf(event.relatedTarget) ? anchor : null;
    };

    const over = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      const anchor = crossed(event);
      if (anchor) show(anchor);
    };

    const out = (event: PointerEvent) => {
      if (event.pointerType === 'mouse' && crossed(event)) hide();
    };

    const focus = (event: FocusEvent) => {
      const anchor = crossed(event);
      if (anchor) show(anchor);
    };

    const blur = (event: FocusEvent) => {
      if (crossed(event)) hide();
    };

    document.addEventListener('pointerover', over);
    document.addEventListener('pointerout', out);
    document.addEventListener('focusin', focus);
    document.addEventListener('focusout', blur);

    return () => {
      document.removeEventListener('pointerover', over);
      document.removeEventListener('pointerout', out);
      document.removeEventListener('focusin', focus);
      document.removeEventListener('focusout', blur);
      window.clearTimeout(opening);
      window.clearTimeout(closing);
      useIslandStore.getState().dismiss(LINK_PREVIEW);
    };
  }, [posts, pathname]);

  return null;
}
