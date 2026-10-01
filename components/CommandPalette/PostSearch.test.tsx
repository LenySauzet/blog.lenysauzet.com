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

/** The page lives inside the cmdk root, which owns the roles it is read through. */
const show = (query: string, onPick = vi.fn()) =>
  render(
    <Command shouldFilter={false}>
      <PostSearch query={query} onResults={vi.fn()} onPick={onPick} />
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

  it('says so while the index is still coming', () => {
    loadSearchIndex.mockReturnValue(new Promise(() => {}));
    show('');

    expect(screen.getByText(/Reading the archive/)).toBeInTheDocument();
  });

  it('says so when the index cannot be read', async () => {
    loadSearchIndex.mockRejectedValue(new Error('offline'));
    show('');

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
        <PostSearch query="" onResults={onResults} onPick={vi.fn()} />
      </Command>
    );

    await waitFor(() => expect(onResults).toHaveBeenCalledWith(['halftone']));
  });
});
