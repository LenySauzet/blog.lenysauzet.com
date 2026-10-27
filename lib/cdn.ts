import siteConfig from '@/config/site';

const ABSOLUTE_URL = /^https?:\/\//i;

// Absolute URLs pass through untouched so a post can point at a third-party
// asset. Isomorphic: the server Image, the client VideoPlayer and the shader
// engine's textures all use it.
export function resolveCdnUrl(src: string, prefix: string): string {
  if (ABSOLUTE_URL.test(src)) return src;
  return `${siteConfig.cdnUrl}/${prefix}/${src.replace(/^\/+/, '')}`;
}

export const resolveImageUrl = (src: string) =>
  resolveCdnUrl(src, siteConfig.cdnPaths.images);

export const resolveVideoUrl = (src: string) =>
  resolveCdnUrl(src, siteConfig.cdnPaths.videos);

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;

export const isVideo = (src: string) => VIDEO.test(src);

// The CDN is namespaced by kind, and the extension is what says which. A table of
// components would have to be kept in step with `mdx-components.tsx`.
export const resolveMediaUrl = (src: string) => (isVideo(src) ? resolveVideoUrl(src) : resolveImageUrl(src));
