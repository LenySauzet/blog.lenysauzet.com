import { describe, expect, it } from 'vitest';

import siteConfig from '@/config/site';

import { resolveCdnUrl } from './cdn';

describe('resolveCdnUrl', () => {
  it('prefixes a relative path with the CDN origin', () => {
    expect(resolveCdnUrl('shade-of-halftone/circle-sdf.png')).toBe(
      `${siteConfig.cdnUrl}/shade-of-halftone/circle-sdf.png`
    );
  });

  it('does not double the slash when the path is rooted', () => {
    expect(resolveCdnUrl('/test.png')).toBe(`${siteConfig.cdnUrl}/test.png`);
    expect(resolveCdnUrl('///test.png')).toBe(`${siteConfig.cdnUrl}/test.png`);
  });

  it('passes absolute URLs through untouched', () => {
    const external = 'https://cdn.maximeheckel.com/videos/blog/demo.mp4';
    expect(resolveCdnUrl(external)).toBe(external);
    expect(resolveCdnUrl('http://example.com/a.png')).toBe(
      'http://example.com/a.png'
    );
  });

  it('matches the protocol case-insensitively', () => {
    expect(resolveCdnUrl('HTTPS://example.com/a.png')).toBe(
      'HTTPS://example.com/a.png'
    );
  });

  it('treats a protocol-like segment inside a path as a path', () => {
    expect(resolveCdnUrl('posts/https-guide/diagram.png')).toBe(
      `${siteConfig.cdnUrl}/posts/https-guide/diagram.png`
    );
  });
});
