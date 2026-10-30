import 'server-only';

import siteConfig from '@/config/site';

import { resolveMediaUrl } from './cdn';
import type { Post } from './post-utils';
import { TWEET_EMBED } from './tweet';

// Shiki's diff notation, in any of the comment syntaxes a fence can be written in.
const DIFF_MARK = /\s*(?:\/\/|#|--|\/\*|<!--)\s*\[!code (\+\+|--)\]\s*(?:\*\/|-->)?\s*$/;

/**
 * A fence that marks lines with `[!code ++]` or `[!code --]` becomes a `diff`
 * fence: the notation is the build's, and left in place it would hand over the
 * removed lines as live code.
 */
const asDiff = (fence: string) => {
  const lines = fence.split('\n');
  if (!lines.some((line) => DIFF_MARK.test(line))) return fence;

  const body = lines.slice(1, -1).map((line) => {
    const mark = line.match(DIFF_MARK)?.[1];
    if (!mark) return ` ${line}`;
    return `${mark === '++' ? '+' : '-'}${line.replace(DIFF_MARK, '')}`;
  });

  return ['```diff', ...body, lines.at(-1)].join('\n');
};

/**
 * A fenced block is the subject, not machinery: a post about Three.js carries
 * `import * as THREE` in an example, a shader post a `src=` in one, and a
 * transform that reaches inside eats them. The split captures the fences, so
 * they fall on the odd indices and are handed back untouched but for the diff
 * notation.
 */
const outsideFences = (body: string, change: (text: string) => string) =>
  body
    .split(/(```[\s\S]*?```)/g)
    .map((part, index) => (index % 2 ? asDiff(part) : change(part)))
    .join('');

const resolveSources = (text: string) =>
  text
    .replace(
      /\b(src|beforeSrc|afterSrc)="([^"]+)"/g,
      (_match: string, prop: string, src: string) => `${prop}="${resolveMediaUrl(src)}"`
    )
    .replace(
      /(!\[[^\]]*\]\()([^)]+)\)/g,
      (_match: string, lead: string, src: string) => `${lead}${resolveMediaUrl(src)})`
    );

// A post on X is a line of JSX outside the page; as a link it says where it was.
const embedTweets = (text: string) =>
  text.replace(
    TWEET_EMBED,
    (_match: string, id: string) => `[A post on X](https://x.com/i/status/${id})`
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
  const body = outsideFences(withoutPreamble(post.content), (text) => embedTweets(resolveSources(text)));

  return `${frontmatter(post)}\n\n${body.trim()}\n`;
}
