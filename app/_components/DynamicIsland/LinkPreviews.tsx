'use client';

import { useEffect } from 'react';

import { useIslandStore } from '@/hooks/use-island-store';
import { resolveLinkPreview, type KnownPosts } from '@/lib/link-preview';

import { linkPreview, LINK_PREVIEW } from './states/link-preview';

const DWELL = 260;
const GRACE = 140;

const anchorOf = (node: EventTarget | null) =>
  node instanceof Element ? node.closest('a[href]') : null;

export function LinkPreviews({ posts }: { posts: KnownPosts }) {
  useEffect(() => {
    let opening: number | undefined;
    let closing: number | undefined;

    const show = (anchor: Element) => {
      const preview = resolveLinkPreview(anchor.getAttribute('href') ?? '', posts);
      if (!preview) return;

      window.clearTimeout(closing);
      window.clearTimeout(opening);
      opening = window.setTimeout(
        () => useIslandStore.getState().present(linkPreview(preview)),
        DWELL
      );
    };

    // Left to run out, the grace period is what carries the island from one link
    // to the next without dropping back to what it was showing in between.
    const hide = () => {
      window.clearTimeout(opening);
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
