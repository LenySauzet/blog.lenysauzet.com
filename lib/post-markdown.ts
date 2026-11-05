import 'server-only';

import siteConfig from '@/config/site';

import { resolveMediaUrl } from './cdn';
import type { Post } from './post-utils';
import { TWEET_EMBED } from './tweet';

const DIFF_MARK = /\s*(?:\/\/|#|--|\/\*|<!--|;|%)\s*\[!code (\+\+|--)\]\s*(?:\*\/|-->)?\s*$/i;

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

// The capturing split puts the fences on the odd indices.
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

const embedTweets = (text: string) =>
  text.replace(
    TWEET_EMBED,
    (_match: string, id: string) => `[A post on X](https://x.com/i/status/${id})`
  );

const IMPORT = /^import\s/;

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

export function toMarkdown(post: Post): string {
  const body = outsideFences(withoutPreamble(post.content), (text) => embedTweets(resolveSources(text)));

  return `${frontmatter(post)}\n\n${body.trim()}\n`;
}
