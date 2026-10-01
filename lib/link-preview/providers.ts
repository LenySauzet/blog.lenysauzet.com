import {
  BlueskyIcon,
  BookOpen01Icon,
  Github01Icon,
  Link01Icon,
  Mail01Icon,
  YoutubeIcon,
} from '@hugeicons/core-free-icons';

import { getLinkTypeIcon, isInternalLink } from '@/lib/url-utils';

import type { KnownPosts, LinkMetadata, LinkPreview } from './types';

interface Provider {
  matches: (url: URL) => boolean;
  preview: (url: URL) => LinkPreview | undefined;
  /** Where the page's own words go when they arrive. */
  merge?: (preview: LinkPreview, metadata: LinkMetadata) => LinkPreview;
}

const segments = (url: URL) => url.pathname.split('/').filter(Boolean);

/**
 * For a provider whose label was read out of the path: their own title is either
 * a repeat of it or, on a page their reader builds, no title at all.
 */
const keepsItsLabel = (preview: LinkPreview, { description, image }: LinkMetadata) => ({
  ...preview,
  detail: preview.detail ?? description,
  image: image ?? preview.image,
});

const youtubeId = (url: URL) =>
  url.hostname === 'youtu.be'
    ? segments(url)[0]
    : (url.searchParams.get('v') ??
      (segments(url)[0] === 'shorts' ? segments(url)[1] : undefined));

const providers: Provider[] = [
  {
    matches: (url) => /(^|\.)youtube\.com$|^youtu\.be$/.test(url.hostname),
    preview: (url) => {
      const id = youtubeId(url);

      return {
        icon: YoutubeIcon,
        label: 'YouTube',
        site: 'YouTube',
        // Derived from the id, so a video has its still before anything is asked.
        image: id && `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      };
    },
  },
  {
    matches: (url) => url.hostname === 'github.com',
    preview: (url) => {
      const [owner, repo, kind, number] = segments(url);
      if (!owner) return { icon: Github01Icon, label: 'github.com' };

      const subject =
        kind === 'issues' ? `Issue #${number}` : kind === 'pull' ? `PR #${number}` : undefined;

      return {
        icon: Github01Icon,
        label: repo ? `${owner}/${repo}` : owner,
        detail: subject,
        site: 'GitHub',
      };
    },
    merge: keepsItsLabel,
  },
  {
    matches: (url) => url.hostname === 'bsky.app',
    preview: (url) => {
      const [, handle] = segments(url);

      return {
        icon: BlueskyIcon,
        label: handle ? `@${handle}` : 'bsky.app',
        site: 'Bluesky',
      };
    },
    merge: keepsItsLabel,
  },
];

const defaultMerge = (preview: LinkPreview, metadata: LinkMetadata): LinkPreview => ({
  ...preview,
  label: metadata.title ?? preview.label,
  detail: metadata.description ?? preview.detail,
  image: metadata.image ?? preview.image,
  site: metadata.site ?? preview.site ?? preview.label,
});

const post = (url: URL, posts: KnownPosts): LinkPreview | undefined => {
  const slug = url.pathname.match(/^\/posts\/([^/]+)/)?.[1];
  const known = slug && posts[slug];

  return known
    ? {
        icon: BookOpen01Icon,
        label: known.title,
        detail: known.description,
        site: 'Blog',
        image: `/posts/${slug}/opengraph-image`,
      }
    : undefined;
};

const parse = (href: string) => (URL.canParse(href, 'https://x') ? new URL(href, 'https://x') : undefined);

/**
 * Only the destinations a reader cannot already name: a post behind link text
 * that says something else, and whatever site an external link leads to. The
 * site's own pages are left alone, their link text being the whole of it.
 */
export function resolveLinkPreview(
  href: string,
  posts: KnownPosts
): LinkPreview | undefined {
  if (href.startsWith('#')) return undefined;

  if (href.startsWith('mailto:')) {
    return { icon: Mail01Icon, label: href.slice('mailto:'.length), site: 'Email' };
  }

  const url = parse(href);
  if (!url) return undefined;

  if (isInternalLink(href)) return post(url, posts);

  return (
    providers.find((provider) => provider.matches(url))?.preview(url) ?? {
      icon: getLinkTypeIcon(href).icon ?? Link01Icon,
      label: url.hostname.replace(/^www\./, ''),
    }
  );
}

/** Whether the island has anything left to learn about this link. */
export const worthAsking = (href: string) =>
  !href.startsWith('#') && !href.startsWith('mailto:') && !isInternalLink(href);

export function enrich(
  href: string,
  preview: LinkPreview,
  metadata: LinkMetadata
): LinkPreview {
  const url = parse(href);
  const merge =
    (url && providers.find((provider) => provider.matches(url))?.merge) ?? defaultMerge;

  return merge(preview, metadata);
}
