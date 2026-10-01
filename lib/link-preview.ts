import { BookOpen01Icon, Link01Icon, Mail01Icon } from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';

import { getLinkTypeIcon, isInternalLink } from '@/lib/url-utils';

export interface LinkPreview {
  icon: IconSvgElement;
  label: string;
}

/** Slug to title, for the posts a link can point at. */
export type KnownPosts = Record<string, string>;

const pathOf = (href: string) => {
  if (href.startsWith('/')) return href;

  try {
    return new URL(href).pathname;
  } catch {
    return undefined;
  }
};

const domainOf = (href: string) => {
  try {
    return new URL(href).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
};

/**
 * Only the destinations a reader cannot already name: a post behind a link whose
 * text says something else, and whatever site an external link leads to. The
 * site's own pages are left alone, their link text being the whole of what the
 * island could say about them.
 */
export function resolveLinkPreview(
  href: string,
  posts: KnownPosts
): LinkPreview | undefined {
  if (href.startsWith('#')) return undefined;

  if (href.startsWith('mailto:')) {
    return { icon: Mail01Icon, label: href.slice('mailto:'.length) };
  }

  if (isInternalLink(href)) {
    const slug = pathOf(href)?.match(/^\/posts\/([^/#?]+)/)?.[1];
    const title = slug && posts[slug];

    return title ? { icon: BookOpen01Icon, label: title } : undefined;
  }

  const domain = domainOf(href);
  if (!domain) return undefined;

  return { icon: getLinkTypeIcon(href).icon ?? Link01Icon, label: domain };
}
