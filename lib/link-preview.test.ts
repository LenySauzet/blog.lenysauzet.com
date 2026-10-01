import { describe, expect, it } from 'vitest';

import { resolveLinkPreview } from './link-preview';

const posts = { 'shades-of-halftone': 'Shades of Halftone' };

const preview = (href: string) => resolveLinkPreview(href, posts);

describe('resolveLinkPreview', () => {
  it('names the post behind a link whose text may not', () => {
    expect(preview('/posts/shades-of-halftone')?.label).toBe('Shades of Halftone');
  });

  it('reads a post through its absolute URL too', () => {
    expect(
      preview('https://blog.lenysauzet.com/posts/shades-of-halftone')?.label
    ).toBe('Shades of Halftone');
  });

  it('ignores the fragment and the query a link may carry', () => {
    expect(preview('/posts/shades-of-halftone#dots')?.label).toBe(
      'Shades of Halftone'
    );
  });

  // A draft, a renamed file, a typo: anything but a published post.
  it('says nothing about a post it does not know', () => {
    expect(preview('/posts/nothing-here')).toBeUndefined();
  });

  // Their link text is the whole of what the island could add.
  it('leaves the site\'s own pages alone', () => {
    expect(preview('/')).toBeUndefined();
    expect(preview('/glossary')).toBeUndefined();
  });

  it('says nothing about a jump within the page', () => {
    expect(preview('#halftone')).toBeUndefined();
  });

  it('names the site an external link leads to, without its www', () => {
    expect(preview('https://www.github.com/LenySauzet')?.label).toBe('github.com');
  });

  it('carries the address of a mail link', () => {
    expect(preview('mailto:hello@lenysauzet.com')?.label).toBe(
      'hello@lenysauzet.com'
    );
  });

  it('falls back to a plain link icon for a site it has no mark for', () => {
    const unknown = preview('https://example.com/a');
    const known = preview('https://github.com/a');

    expect(unknown?.label).toBe('example.com');
    expect(unknown?.icon).not.toEqual(known?.icon);
  });
});
