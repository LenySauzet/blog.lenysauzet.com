import { render, screen, waitFor } from '@testing-library/react';
import MiniSearch from 'minisearch';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { Command } from '@/components/ui/command';
import { INDEX_OPTIONS, type SearchDocument } from '@/lib/search/config';

import { PostSearch } from './PostSearch';

const { loadSearchIndex } = vi.hoisted(() => ({ loadSearchIndex: vi.fn() }));
vi.mock('@/lib/search/load-index', () => ({ loadSearchIndex }));

const POSTS: SearchDocument[] = [
  {
    slug: 'halftone',
    title: 'Shades of Halftone',
    description: 'Dots on a grid.',
    tags: 'glsl shaders',
    date: '2026-04-22',
    text: 'The halftone dot pattern is an optical illusion of smooth tone.',
  },
  {
    slug: 'octrees',
    title: 'Optimizing Octrees',
    description: 'Spatial partitioning.',
    tags: 'performance',
    date: '2026-02-02',
    text: 'An octree splits space into eight until the leaves are small enough.',
  },
];

const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
index.addAll(POSTS);

// The page lives inside the cmdk root, which owns the roles it is read through.
const show = (query: string, onPick = vi.fn()) =>
  render(
    <Command shouldFilter={false}>
      <PostSearch query={query} onResults={vi.fn()} onPick={onPick} />
    </Command>
  );

const titles = () =>
  screen.getAllByRole('option').map((row) => row.getAttribute('data-value'));

beforeEach(() => {
  loadSearchIndex.mockResolvedValue(index);
});

describe('PostSearch', () => {
  // An empty box is a table of contents, not a surface waiting to be used.
  it('lists every post newest first before anything is typed', async () => {
    show('');

    await waitFor(() => expect(titles()).toEqual(['halftone', 'octrees']));
  });

  it('narrows to what was asked for', async () => {
    show('octree');

    await waitFor(() => expect(titles()).toEqual(['octrees']));
  });

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

  it('says so when the index cannot be read', async () => {
    loadSearchIndex.mockRejectedValue(new Error('offline'));
    show('');

    expect(await screen.findByText(/could not be loaded/)).toBeInTheDocument();
  });

  it('hands back the post that was picked', async () => {
    const onPick = vi.fn();
    show('octree', onPick);

    (await screen.findByRole('option')).click();

    expect(onPick).toHaveBeenCalledWith('octrees');
  });
});
