import { describe, expect, it, vi } from 'vitest';

import { generateMetadata } from './page';

vi.mock('@/content/demo.mdx', () => ({
  metadata: { title: 'A Post', description: 'What it says.', date: '2026-10-29' },
}));

const metadataOf = (slug: string) => generateMetadata({ params: Promise.resolve({ slug }) });

describe('generateMetadata', () => {
  it('leaves the site name to the root template, which adds it to the page title', async () => {
    expect((await metadataOf('demo')).title).toBe('A Post');
  });

  it('names the site in the social titles, which the template does not reach', async () => {
    const { openGraph, twitter } = await metadataOf('demo');

    expect(openGraph?.title).toBe('A Post - The Blog of Lény Sauzet');
    expect(twitter?.title).toBe('A Post - The Blog of Lény Sauzet');
  });
});
