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
  preview: (url: URL) => LinkPreview;
  merge?: (preview: LinkPreview, metadata: LinkMetadata) => LinkPreview;
}

const segments = (url: URL) => url.pathname.split('/').filter(Boolean);

/** Their own title either repeats the path or, on a page built in the reader's
    browser, is the name of the app. */
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
        image: id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : undefined,
      };
    },
  },
  {
    matches: (url) => url.hostname === 'github.com',
    preview: (url) => {
      const [owner, repo, kind, number] = segments(url);
      if (!owner) return { icon: Github01Icon, label: 'github.com' };

      return {
        icon: Github01Icon,
        label: repo ? `${owner}/${repo}` : owner,
        detail:
          kind === 'issues'
            ? `Issue #${number}`
            : kind === 'pull'
              ? `PR #${number}`
              : undefined,
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

const BASE = 'https://relative';

const parse = (href: string) =>
  URL.canParse(href, BASE) ? new URL(href, BASE) : undefined;

const providerFor = (url: URL) => providers.find((provider) => provider.matches(url));

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

export const worthAsking = (href: string) =>
  !href.startsWith('#') && !href.startsWith('mailto:') && !isInternalLink(href);

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
    providerFor(url)?.preview(url) ?? {
      icon: getLinkTypeIcon(href).icon ?? Link01Icon,
      label: url.hostname.replace(/^www\./, ''),
    }
  );
}

export function enrich(
  href: string,
  preview: LinkPreview,
  metadata: LinkMetadata
): LinkPreview {
  const url = parse(href);

  return ((url && providerFor(url)?.merge) ?? defaultMerge)(preview, metadata);
}
