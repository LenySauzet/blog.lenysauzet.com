import { describe, expect, it } from 'vitest';

import siteConfig from '@/config/site';

import { resolveCdnUrl, resolveImageUrl, resolveVideoUrl } from './cdn';

const { cdnUrl } = siteConfig;

describe('resolveCdnUrl', () => {
  it('places a relative path under the given prefix', () => {
    expect(resolveCdnUrl('blog/halftone.png', 'images')).toBe(
      `${cdnUrl}/images/blog/halftone.png`
    );
  });

  it('does not double the slash when the path is rooted', () => {
    expect(resolveCdnUrl('/halftone.png', 'images')).toBe(
      `${cdnUrl}/images/halftone.png`
    );
    expect(resolveCdnUrl('///halftone.png', 'images')).toBe(
      `${cdnUrl}/images/halftone.png`
    );
  });

  it('passes absolute URLs through untouched, ignoring the prefix', () => {
    const external = 'https://cdn.maximeheckel.com/videos/blog/demo.mp4';
    expect(resolveCdnUrl(external, 'videos')).toBe(external);
    expect(resolveCdnUrl('http://example.com/a.png', 'images')).toBe(
      'http://example.com/a.png'
    );
  });

  it('matches the protocol case-insensitively', () => {
    expect(resolveCdnUrl('HTTPS://example.com/a.png', 'images')).toBe(
      'HTTPS://example.com/a.png'
    );
  });

  it('treats a protocol-like segment inside a path as a path', () => {
    expect(resolveCdnUrl('posts/https-guide/diagram.png', 'images')).toBe(
      `${cdnUrl}/images/posts/https-guide/diagram.png`
    );
  });
});

describe('media-kind resolvers', () => {
  it('namespaces images under the images prefix', () => {
    expect(resolveImageUrl('blog/halftone.png')).toBe(
      `${cdnUrl}/images/blog/halftone.png`
    );
  });

  it('namespaces videos under the videos prefix', () => {
    expect(resolveVideoUrl('blog/demo.mp4')).toBe(
      `${cdnUrl}/videos/blog/demo.mp4`
    );
  });

  it('keeps a post free to point at a third-party asset', () => {
    const external = 'https://cdn.maximeheckel.com/videos/blog/demo.mp4';
    expect(resolveVideoUrl(external)).toBe(external);
  });
});
