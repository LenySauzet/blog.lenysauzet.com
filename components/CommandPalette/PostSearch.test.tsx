import { render, screen, waitFor } from '@testing-library/react';
import MiniSearch from 'minisearch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/components/ui/command';
import { INDEX_OPTIONS, type SearchDocument } from '@/lib/search/config';

import { PostSearch } from './PostSearch';

const { loadSearchIndex } = vi.hoisted(() => ({ loadSearchIndex: vi.fn() }));
vi.mock('@/lib/search/load-index', () => ({ loadSearchIndex }));

const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
index.add({
  slug: 'halftone',
  title: 'Shades of Halftone',
  description: 'Dots on a grid.',
  tags: 'glsl',
  date: '2026-04-22',
  text: 'The halftone dot pattern is an optical illusion of smooth tone.',
});

/** What the server hands the palette, which is what an unsearched list shows. */
const posts = [
  {
    slug: 'halftone',
    title: 'Shades of Halftone',
    description: 'Dots on a grid.',
    date: '2026-04-22',
  },
];

/** The page lives inside the cmdk root, which owns the roles it is read through. */
const show = (query: string, onPick = vi.fn()) =>
  render(
    <Command shouldFilter={false}>
      <PostSearch posts={posts} query={query} onResults={vi.fn()} onPick={onPick} />
    </Command>
  );

beforeEach(() => {
  loadSearchIndex.mockResolvedValue(index);
});

describe('PostSearch', () => {
  // The description would read the same on every result; the matched line does not.
  it('quotes the line that matched and lifts the term out of it', async () => {
    show('illusion');

    const marked = await screen.findByText('illusion');
    expect(marked).toHaveClass('text-primary');
    expect(marked.closest('p')).toHaveTextContent('optical illusion');
  });

  it('says so rather than showing an empty list when nothing matches', async () => {
    show('kubernetes');

    expect(await screen.findByText(/No post says anything/)).toBeInTheDocument();
  });

  // The unsearched list is the server's and waits on nothing. It used to be
  // the index's, which arrived after the page did and resized the palette
  // under the reader on every cold load.
  it('lists the posts without asking for the index at all', () => {
    loadSearchIndex.mockReturnValue(new Promise(() => {}));
    show('');

    expect(screen.getByText('Shades of Halftone')).toBeInTheDocument();
    expect(screen.getByText('Dots on a grid.')).toBeInTheDocument();
    expect(loadSearchIndex).not.toHaveBeenCalled();
  });

  it('keeps the list up while an index asked for late is still coming', () => {
    loadSearchIndex.mockReturnValue(new Promise(() => {}));
    show('halftone');

    expect(screen.getByText('Shades of Halftone')).toBeInTheDocument();
    expect(loadSearchIndex).toHaveBeenCalled();
  });

  it('says so when the index cannot be read', async () => {
    loadSearchIndex.mockRejectedValue(new Error('offline'));
    show('halftone');

    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });

  it('hands back the post that was picked', async () => {
    const onPick = vi.fn();
    show('halftone', onPick);

    (await screen.findByRole('option')).click();

    expect(onPick).toHaveBeenCalledWith('halftone');
  });

  it('tells the palette which rows are on show', async () => {
    const onResults = vi.fn();
    render(
      <Command shouldFilter={false}>
        <PostSearch posts={posts} query="" onResults={onResults} onPick={vi.fn()} />
      </Command>
    );

    await waitFor(() => expect(onResults).toHaveBeenCalledWith(['halftone']));
  });
});
