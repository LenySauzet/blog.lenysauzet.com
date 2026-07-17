import siteConfig from '@/config/site';

const ABSOLUTE_URL = /^https?:\/\//i;

/**
 * Resolves a media path against the CDN origin.
 *
 * Posts reference assets by their path relative to the CDN root
 * (`shade-of-halftone/circle-sdf.png`), which keeps the origin out of the
 * content and swappable from a single place. Absolute URLs are passed through
 * untouched so a post can still point at a third-party asset.
 *
 * Isomorphic on purpose: both the server Image component and the client
 * VideoPlayer depend on it.
 */
export function resolveCdnUrl(src: string): string {
  if (ABSOLUTE_URL.test(src)) return src;
  return `${siteConfig.cdnUrl}/${src.replace(/^\/+/, '')}`;
}
