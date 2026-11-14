import siteConfig from '@/config/site';

const ABSOLUTE_URL = /^https?:\/\//i;

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

export const resolveMediaUrl = (src: string) => (isVideo(src) ? resolveVideoUrl(src) : resolveImageUrl(src));
