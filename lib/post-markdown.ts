import 'server-only';

import siteConfig from '@/config/site';

import { resolveImageUrl, resolveVideoUrl } from './cdn';
import type { Post } from './post-utils';

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;

/** The CDN is namespaced by kind, and the extension is what says which. A table
    of components would have to be kept in step with `mdx-components.tsx`. */
const resolve = (src: string) => (VIDEO.test(src) ? resolveVideoUrl(src) : resolveImageUrl(src));

/**
 * A fenced block is the subject, not machinery: a post about Three.js carries
 * `import * as THREE` in an example, a shader post a `src=` in one, and a
 * transform that reaches inside eats them. The split captures the fences, so
 * they fall on the odd indices and are handed back untouched.
 */
const outsideFences = (body: string, change: (text: string) => string) =>
  body
    .split(/(```[\s\S]*?```)/g)
    .map((part, index) => (index % 2 ? part : change(part)))
    .join('');

const resolveSources = (text: string) =>
  text
    .replace(
      /\b(src|beforeSrc|afterSrc)="([^"]+)"/g,
      (_match: string, prop: string, src: string) => `${prop}="${resolve(src)}"`
    )
    .replace(
      /(!\[[^\]]*\]\()([^)]+)\)/g,
      (_match: string, lead: string, src: string) => `${lead}${resolve(src)})`
    );

const IMPORT = /^import\s/;

/**
 * Only what the file opens with. An import can also be a line of an example a
 * component carries in a prop, which begins at column zero like any other and
 * is the subject rather than the build's: anchoring to every line start cost
 * the design system its `import './scene.css';`.
 */
const withoutPreamble = (content: string) => {
  const lines = content.replace(/^export const metadata = \{[\s\S]*?^\};?$/m, '').split('\n');
  let opening = 0;

  while (opening < lines.length && (IMPORT.test(lines[opening]) || !lines[opening].trim())) {
    opening += 1;
  }

  return [...lines.slice(0, opening).filter((line) => !IMPORT.test(line)), ...lines.slice(opening)]
    .join('\n');
};

/** A string YAML would read as something else: a mapping, a list, a number. */
const scalar = (value: string) =>
  /^[\w][\w .,'’!?()-]*$/.test(value) ? value : JSON.stringify(value);

const frontmatter = (post: Post) => {
  const { title, description, tags, date, updated } = post.metadata;

  return [
    '---',
    `title: ${scalar(title)}`,
    `description: ${scalar(description)}`,
    `date: ${date}`,
    ...(updated ? [`updated: ${updated}`] : []),
    `tags: [${tags.join(', ')}]`,
    `source: ${siteConfig.url}/posts/${post.slug}`,
    '---',
  ].join('\n');
};

/**
 * A post as the file it was written as, minus the two things that only mean
 * something inside the build: the metadata export, which no parser but a
 * bundler reads, and the imports, which name modules nothing here can load.
 */
export function toMarkdown(post: Post): string {
  const body = outsideFences(withoutPreamble(post.content), resolveSources);

  return `${frontmatter(post)}\n\n${body.trim()}\n`;
}
