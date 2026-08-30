import { describe, expect, it } from 'vitest';

import { excerpt } from './excerpt';

const join = (text: string, terms: string[], window?: number) =>
  excerpt(text, terms, window)
    .map((segment) => segment.text)
    .join('');

const marked = (text: string, terms: string[]) =>
  excerpt(text, terms)
    .filter((segment) => segment.match)
    .map((segment) => segment.text);

describe('excerpt', () => {
  it('quotes the head of the post when nothing matched', () => {
    expect(join('A short post.', [])).toBe('A short post.');
  });

  it('lifts out every occurrence of a matched term', () => {
    expect(marked('Halftone dots, and more halftone.', ['halftone'])).toEqual([
      'Halftone',
      'halftone',
    ]);
  });

  // MiniSearch hands back the document's word, not the query's, so the excerpt
  // marks "motorcycle" for a search that only typed "moto".
  it('marks the whole word a prefix search reached', () => {
    expect(marked('Zen and motorcycle maintenance', ['motorcycle'])).toEqual([
      'motorcycle',
    ]);
  });

  it('centres the window on the match rather than on the post', () => {
    const text = `${'filler '.repeat(60)}needle ${'filler '.repeat(60)}`;

    expect(join(text, ['needle'])).toContain('needle');
  });

  it('marks the ends it cut, and only those', () => {
    const text = `${'filler '.repeat(60)}needle ${'filler '.repeat(60)}`;

    expect(join(text, ['needle']).startsWith('…')).toBe(true);
    expect(join(text, ['needle']).endsWith('…')).toBe(true);
    expect(join('Short enough.', ['short'])).toBe('Short enough.');
  });

  it('never opens or closes mid-word', () => {
    const quote = join(`${'filler '.repeat(60)}needle ${'filler '.repeat(60)}`, [
      'needle',
    ]);

    expect(quote.replace(/…/g, '').trim().split(' ')).not.toContain('fill');
  });

  it('keeps the quote to roughly the window it was given', () => {
    const text = `${'filler '.repeat(60)}needle ${'filler '.repeat(60)}`;

    expect(join(text, ['needle'], 80).length).toBeLessThanOrEqual(82);
  });

  // Longest first, so "halftone" is not eaten by a shorter term inside it.
  it('prefers the longest term where two overlap', () => {
    expect(marked('A halftone grid.', ['half', 'halftone'])).toEqual(['halftone']);
  });
});
