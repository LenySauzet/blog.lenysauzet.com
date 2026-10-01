'use client';

import { useEffect } from 'react';

import { useIslandStore } from '@/hooks/use-island-store';
import {
  askAbout,
  enrich,
  resolveLinkPreview,
  worthAsking,
  type KnownPosts,
} from '@/lib/link-preview';

import { linkPreview, LINK_PREVIEW } from './states/link-preview';

const DWELL = 260;
const GRACE = 140;

const anchorOf = (node: EventTarget | null) =>
  node instanceof Element ? node.closest('a[href]') : null;

export function LinkPreviews({ posts }: { posts: KnownPosts }) {
  useEffect(() => {
    let opening: number | undefined;
    let closing: number | undefined;
    let pointed: string | undefined;

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
        useIslandStore.getState().present(linkPreview(preview));

        // The island keeps what the URL alone said until the page answers, and
        // keeps it for good if the answer lands after the reader has moved on.
        asked?.then((metadata) => {
          if (pointed !== href) return;
          useIslandStore.getState().present(linkPreview(enrich(href, preview, metadata)));
        });
      }, DWELL);
    };

    // Left to run out, the grace period is what carries the island from one link
    // to the next without dropping back to what it was showing in between.
    const hide = () => {
      window.clearTimeout(opening);
      pointed = undefined;
      closing = window.setTimeout(
        () => useIslandStore.getState().dismiss(LINK_PREVIEW),
        GRACE
      );
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
  }, [posts]);

  return null;
}
