import siteConfig from '@/config/site';

const ABSOLUTE_URL = /^https?:\/\//i;

// Absolute URLs pass through untouched so a post can point at a third-party
// asset. Isomorphic: both the server Image and the client VideoPlayer use it.
export function resolveCdnUrl(src: string, prefix: string): string {
  if (ABSOLUTE_URL.test(src)) return src;
  return `${siteConfig.cdnUrl}/${prefix}/${src.replace(/^\/+/, '')}`;
}

export const resolveImageUrl = (src: string) =>
  resolveCdnUrl(src, siteConfig.cdnPaths.images);

export const resolveVideoUrl = (src: string) =>
  resolveCdnUrl(src, siteConfig.cdnPaths.videos);
