import siteConfig from '@/config/site';

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Resolves a media path against the CDN origin, under its media-kind prefix.
 *
 * Posts reference assets by their path relative to that prefix
 * (`blog/halftone.png` → `{cdnUrl}/images/blog/halftone.png`), which keeps the
 * origin and the bucket layout out of the content and swappable from
 * `config/site.ts`. Absolute URLs are passed through untouched so a post can
 * still point at a third-party asset.
 *
 * Isomorphic on purpose: both the server Image component and the client
 * VideoPlayer depend on it.
 */
export function resolveCdnUrl(src: string, prefix: string): string {
  if (ABSOLUTE_URL.test(src)) return src;
  return `${siteConfig.cdnUrl}/${prefix}/${src.replace(/^\/+/, '')}`;
}

export const resolveImageUrl = (src: string) =>
  resolveCdnUrl(src, siteConfig.cdnPaths.images);

export const resolveVideoUrl = (src: string) =>
  resolveCdnUrl(src, siteConfig.cdnPaths.videos);
