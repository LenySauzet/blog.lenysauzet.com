import { describe, expect, it } from 'vitest';

import { enrich, resolveLinkPreview, worthAsking } from './providers';

const posts = {
  'shades-of-halftone': {
    title: 'Shades of Halftone',
    description: 'Dots on a grid.',
  },
};

const preview = (href: string) => resolveLinkPreview(href, posts);

describe('resolveLinkPreview', () => {
  it('draws a post entirely from the build, image included', () => {
    expect(preview('/posts/shades-of-halftone')).toMatchObject({
      label: 'Shades of Halftone',
      detail: 'Dots on a grid.',
      site: 'Blog',
      image: '/posts/shades-of-halftone/opengraph-image',
    });
  });

  it('reads a post through its absolute URL, and past its fragment', () => {
    expect(preview('https://blog.lenysauzet.com/posts/shades-of-halftone')?.label).toBe(
      'Shades of Halftone'
    );
    expect(preview('/posts/shades-of-halftone#dots')?.label).toBe('Shades of Halftone');
  });

  it('says nothing about a post it does not know, nor about the site itself', () => {
    expect(preview('/posts/nothing-here')).toBeUndefined();
    expect(preview('/')).toBeUndefined();
    expect(preview('#halftone')).toBeUndefined();
  });

  // The still comes out of the id, so a video has a picture before anything is asked.
  it.each([
    'https://youtu.be/gOGtHkBQQiQ',
    'https://www.youtube.com/watch?v=gOGtHkBQQiQ',
    'https://youtube.com/shorts/gOGtHkBQQiQ',
  ])('finds the still of %s without asking anyone', (href) => {
    expect(preview(href)?.image).toBe('https://i.ytimg.com/vi/gOGtHkBQQiQ/hqdefault.jpg');
  });

  it('reads a repository out of a GitHub path', () => {
    expect(preview('https://github.com/LenySauzet/blog')).toMatchObject({
      label: 'LenySauzet/blog',
      site: 'GitHub',
    });
    expect(preview('https://github.com/LenySauzet/blog/pull/85')?.detail).toBe('PR #85');
    expect(preview('https://github.com/LenySauzet/blog/issues/12')?.detail).toBe(
      'Issue #12'
    );
  });

  it('reads a handle out of a Bluesky profile', () => {
    expect(preview('https://bsky.app/profile/lenysauzet.com')?.label).toBe(
      '@lenysauzet.com'
    );
  });

  it('names an unremarkable site by its domain, without the www', () => {
    expect(preview('https://www.example.com/a/b')?.label).toBe('example.com');
  });

  it('carries the address of a mail link', () => {
    expect(preview('mailto:hello@lenysauzet.com')?.label).toBe('hello@lenysauzet.com');
  });
});

describe('worthAsking', () => {
  it('asks only where the answer is not already in hand', () => {
    expect(worthAsking('https://example.com')).toBe(true);
    expect(worthAsking('/posts/shades-of-halftone')).toBe(false);
    expect(worthAsking('mailto:a@b.c')).toBe(false);
    expect(worthAsking('#here')).toBe(false);
  });
});

describe('enrich', () => {
  const site = preview('https://www.example.com/a')!;

  it('lets the page speak, and keeps the domain as where it was said', () => {
    expect(enrich('https://www.example.com/a', site, { title: 'A Real Title' })).toMatchObject(
      { label: 'A Real Title', site: 'example.com' }
    );
  });

  it('keeps what the URL said when the page says nothing', () => {
    expect(enrich('https://www.example.com/a', site, {}).label).toBe('example.com');
  });

  // Their title repeats the repository the path already gave us.
  it('leaves a GitHub repository named as the path named it', () => {
    const repo = preview('https://github.com/LenySauzet/blog')!;

    expect(
      enrich('https://github.com/LenySauzet/blog', repo, {
        title: 'GitHub - LenySauzet/blog: the blog',
        description: 'The blog.',
      })
    ).toMatchObject({ label: 'LenySauzet/blog', detail: 'The blog.' });
  });

  // Their page is built by the reader's browser, so its title is the app's name.
  it('keeps a Bluesky handle over the generic title their page carries', () => {
    const profile = preview('https://bsky.app/profile/lenysauzet.com')!;

    expect(
      enrich('https://bsky.app/profile/lenysauzet.com', profile, { title: 'Bluesky' }).label
    ).toBe('@lenysauzet.com');
  });

  it('keeps the subject of an issue over the repository description', () => {
    const issue = preview('https://github.com/LenySauzet/blog/issues/12')!;

    expect(enrich('https://github.com/LenySauzet/blog/issues/12', issue, {
      description: 'The blog.',
    }).detail).toBe('Issue #12');
  });
});
