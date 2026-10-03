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

  /**
   * A post about Three.js will carry `import * as THREE` in an example sooner
   * or later, and a shader post a `src=` in one. Both are the subject, not
   * machinery, and a transform that reaches inside a fence eats them.
   */
  it('leaves a fenced block entirely alone', () => {
    const fenced = [
      '```ts',
      "import * as THREE from 'three';",
      '',
      'const html = `<Image src="blog/not-a-real-asset.png" />`;',
      '```',
    ].join('\n');

    const out = toMarkdown(post(`${FRONTMATTER}\n\nBefore.\n\n${fenced}\n\nAfter.`));

    expect(out).toContain(fenced);
  });

  /**
   * A Sandpack holds its example in a prop, as a template literal, so a line
   * of that example can begin at column zero halfway down the file. Stripped
   * by a pattern anchored to any line start, the example silently loses it,
   * which is what happened to `import './scene.css';` in the design system.
   */
  it('only strips the imports the file opens with', () => {
    const sandpack = [
      '<Sandpack',
      '  files={{',
      "    '/App.js': `import { motion } from 'motion/react';",
      "import './scene.css';",
      '',
      'function App() {}`,',
      '  }}',
      '/>',
    ].join('\n');

    const out = toMarkdown(post(`import { Sandpack } from '@/x';\n\n${sandpack}`));

    expect(out).toContain("import './scene.css';");
    expect(out).not.toContain('import { Sandpack }');
  });

  it('still reaches what sits between two fences', () => {
    const out = toMarkdown(
      post('```ts\nconst a = 1;\n```\n\n<Image src="blog/a.png" />\n\n```ts\nconst b = 2;\n```')
    );

    expect(out).toContain('src="https://cdn.lenysauzet.com/images/blog/a.png"');
    expect(out).toContain('const a = 1;');
    expect(out).toContain('const b = 2;');
  });

  it('ends with a single newline, the way a text file does', () => {
    expect(toMarkdown(post('Body.'))).toMatch(/[^\n]\n$/);
  });
});
