import MiniSearch from 'minisearch';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { INDEX_OPTIONS, type SearchDocument } from './config';

const serialized = () => {
  const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
  index.add({
    slug: 'halftone',
    title: 'Shades of Halftone',
    description: 'Dots on a grid.',
    tags: 'glsl',
    date: '2026-04-22',
    text: 'The dot pattern is an optical illusion.',
  });
  return JSON.stringify(index);
};

// Cached at module scope, so each case needs its own copy of the module.
const freshLoad = async () => {
  vi.resetModules();
  return (await import('./load-index')).loadSearchIndex;
};

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(serialized(), { status: 200 }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadSearchIndex', () => {
  it('hands back an index that can be searched', async () => {
    const load = await freshLoad();

    const index = await load();

    expect(index.search('halftone').map((result) => result.id)).toEqual([
      'halftone',
    ]);
  });

  // Opening the palette five times should not fetch and parse it five times.
  it('fetches once however many times it is asked', async () => {
    const load = await freshLoad();

    await Promise.all([load(), load()]);
    await load();

    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('drops what it could not load, so the next search tries again', async () => {
    const load = await freshLoad();
    vi.mocked(fetch).mockRejectedValueOnce(new Error('offline'));

    await expect(load()).rejects.toThrow('offline');
    await expect(load()).resolves.toBeInstanceOf(MiniSearch);
  });

  it('treats a page served in place of the index as a failure', async () => {
    const load = await freshLoad();
    vi.mocked(fetch).mockResolvedValueOnce(new Response('', { status: 404 }));

    await expect(load()).rejects.toThrow('404');
  });
});
