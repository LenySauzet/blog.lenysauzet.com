import { beforeEach, describe, expect, it, vi } from 'vitest';

const getPosts = vi.hoisted(() => vi.fn());
vi.mock('@/lib/post-utils', () => ({ getPosts }));

const withContent = (...content: string[]) =>
  getPosts.mockResolvedValue(content.map((text) => ({ content: text })));

const load = async () => (await import('./allowed-hosts')).isLinkedFromAPost;

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
});

describe('isLinkedFromAPost', () => {
  it('allows a host a post links to', async () => {
    withContent('see [Paper](https://paper.design/) for more');
    const allowed = await load();

    expect(await allowed('paper.design')).toBe(true);
  });

  // Anyone can call the route, and the only URLs it needs are the hoverable ones.
  it('refuses a host no post mentions', async () => {
    withContent('nothing here');
    const allowed = await load();

    expect(await allowed('example.com')).toBe(false);
    expect(await allowed('169.254.169.254')).toBe(false);
  });

  it('reads past the www and the port, and ignores case', async () => {
    withContent('<https://WWW.Example.com:8443/a/b>');
    const allowed = await load();

    expect(await allowed('example.com')).toBe(true);
    expect(await allowed('www.example.com')).toBe(true);
  });

  it('does not let a path segment pass for a host', async () => {
    withContent('https://paper.design/pricing');
    const allowed = await load();

    expect(await allowed('pricing')).toBe(false);
  });

  it('keeps subdomains apart', async () => {
    withContent('https://cdn.example.com/a.png');
    const allowed = await load();

    expect(await allowed('cdn.example.com')).toBe(true);
    expect(await allowed('example.com')).toBe(false);
  });

  // Reachable by URL, so their links are hoverable too.
  it('reads drafts as well', async () => {
    withContent('https://paper.design/');
    await (await load())('paper.design');

    expect(getPosts).toHaveBeenCalledWith({ includeDrafts: true });
  });

  it('reads the posts once, however often it is asked', async () => {
    withContent('https://paper.design/');
    const allowed = await load();

    await Promise.all([allowed('paper.design'), allowed('x.com'), allowed('paper.design')]);

    expect(getPosts).toHaveBeenCalledTimes(1);
  });
});
