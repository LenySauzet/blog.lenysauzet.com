import MiniSearch from 'minisearch';
import { describe, expect, it } from 'vitest';

import { INDEX_OPTIONS, type SearchDocument } from './config';
import { searchPosts } from './query';

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

const slugs = (query: string) => searchPosts(index, query).map((post) => post.slug);

describe('searchPosts', () => {
  it('lists every post newest first when nothing is typed', () => {
    expect(slugs('')).toEqual(['halftone', 'octrees']);
    expect(slugs('   ')).toEqual(['halftone', 'octrees']);
  });

  it('narrows to what was asked for', () => {
    expect(slugs('octree')).toEqual(['octrees']);
  });

  it('matches a word only the body carries', () => {
    expect(slugs('illusion')).toEqual(['halftone']);
  });

  it('matches on tags as well as prose', () => {
    expect(slugs('glsl')).toEqual(['halftone']);
  });

  it('requires every word to match', () => {
    expect(slugs('octree illusion')).toEqual([]);
  });

  it('forgives a typo once a word is long enough to hide one', () => {
    expect(slugs('octrees')).toEqual(['octrees']);
    expect(slugs('ocrees')).toEqual(['octrees']);
  });

  it('reports the words the document matched on', () => {
    expect(searchPosts(index, 'illus')[0].terms).toContain('illusion');
  });
});
