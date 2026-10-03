import { describe, expect, it } from 'vitest';

import { toMarkdown } from './post-markdown';
import type { Post } from './post-utils';

const post = (content: string, metadata: Partial<Post['metadata']> = {}): Post => ({
  slug: 'halftone',
  metadata: {
    title: 'Shades of Halftone',
    description: 'Dots on a grid.',
    tags: ['glsl', 'shaders'],
    date: '2026-04-22',
    ...metadata,
  },
  content,
  lastModified: new Date('2026-04-22'),
});

const FRONTMATTER = `export const metadata = {
  title: 'Shades of Halftone',
  description: 'Dots on a grid.',
  tags: ['glsl'],
  date: '2026-04-22',
};`;

describe('toMarkdown', () => {
  // `export const metadata = {` is parseable by a bundler and nothing else.
  it('reads the metadata out as YAML and drops the block it came from', () => {
    const out = toMarkdown(post(`${FRONTMATTER}\n\nThe dots.`));

    expect(out).toMatch(/^---\n/);
    expect(out).toContain('title: Shades of Halftone');
    expect(out).toContain('date: 2026-04-22');
    expect(out).toContain('tags: [glsl, shaders]');
    expect(out).not.toContain('export const metadata');
    expect(out).toContain('The dots.');
  });

  it('says where the post lives, which the file alone does not', () => {
    expect(toMarkdown(post('Body.'))).toContain(
      'source: https://blog.lenysauzet.com/posts/halftone'
    );
  });

  // A title holding a colon, or a quote, is a YAML document that will not parse.
  it('quotes a title YAML would otherwise read as a mapping', () => {
    const out = toMarkdown(post('Body.', { title: 'Shaders: a field guide' }));

    expect(out).toContain('title: "Shaders: a field guide"');
  });

  it('carries an update where there is one, and nothing where there is not', () => {
    expect(toMarkdown(post('Body.', { updated: '2026-05-01' }))).toContain('updated: 2026-05-01');
    expect(toMarkdown(post('Body.'))).not.toContain('updated:');
  });

  // The body is the point: fences, headings and links survive untouched.
  it('leaves the prose exactly as written', () => {
    const body = '## Why\n\nA [link](https://x.dev).\n\n```glsl\nvec3 p;\n```';

    expect(toMarkdown(post(`${FRONTMATTER}\n\n${body}`))).toContain(body);
  });

  it('drops the imports, which name modules nothing here can load', () => {
    const out = toMarkdown(post("import { Thing } from '@/components/Thing';\n\nBody."));

    expect(out).not.toContain('import {');
    expect(out).toContain('Body.');
  });

  /**
   * The CDN is namespaced by kind, and a bare `blog/halftone.png` resolves to
   * nothing off the site. The extension says which namespace, so no table of
   * components has to be kept in step with `mdx-components.tsx`.
   */
  it('resolves a relative source against the CDN, by what the file is', () => {
    const out = toMarkdown(
      post('<Image src="blog/halftone.png" />\n<VideoPlayer src="blog/clip.mp4" />')
    );

    expect(out).toContain('src="https://cdn.lenysauzet.com/images/blog/halftone.png"');
    expect(out).toContain('src="https://cdn.lenysauzet.com/videos/blog/clip.mp4"');
  });

  it('resolves the pair a comparison carries, and a markdown image', () => {
    const out = toMarkdown(
      post('<BeforeAfterImage beforeSrc="blog/a.jpg" afterSrc="blog/b.jpg" />\n![Alt](blog/c.png)')
    );

    expect(out).toContain('beforeSrc="https://cdn.lenysauzet.com/images/blog/a.jpg"');
    expect(out).toContain('afterSrc="https://cdn.lenysauzet.com/images/blog/b.jpg"');
    expect(out).toContain('![Alt](https://cdn.lenysauzet.com/images/blog/c.png)');
  });

  it('leaves a source that already points somewhere alone', () => {
    const elsewhere = 'https://cdn.maximeheckel.com/videos/blog/clip.mp4';

    expect(toMarkdown(post(`<VideoPlayer src="${elsewhere}" />`))).toContain(elsewhere);
  });

  it('ends with a single newline, the way a text file does', () => {
    expect(toMarkdown(post('Body.'))).toMatch(/[^\n]\n$/);
  });
});
