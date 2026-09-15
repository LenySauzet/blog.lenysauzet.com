import 'server-only';

import MiniSearch from 'minisearch';

import { getPosts } from '@/lib/post-utils';

import { INDEX_OPTIONS, type SearchDocument } from './config';
import { toPlainText } from './plain-text';

/**
 * The whole index, serialized once at build time. Drafts are left out by
 * `getPosts`, so a post hidden from the feed is not findable through the back door.
 */
export async function buildSearchIndex(): Promise<string> {
  const posts = await getPosts();

  const documents: SearchDocument[] = posts.map((post) => ({
    slug: post.slug,
    title: post.metadata.title,
    description: post.metadata.description ?? '',
    tags: (post.metadata.tags ?? []).join(' '),
    date: post.metadata.date,
    text: toPlainText(post.content),
  }));

  const index = new MiniSearch<SearchDocument>(INDEX_OPTIONS);
  index.addAll(documents);

  return JSON.stringify(index);
}
