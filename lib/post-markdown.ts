import 'server-only';

import siteConfig from '@/config/site';

import { resolveImageUrl, resolveVideoUrl } from './cdn';
import type { Post } from './post-utils';

const VIDEO = /\.(mp4|webm|mov|m4v)$/i;

/** The CDN is namespaced by kind, and the extension is what says which. A table
    of components would have to be kept in step with `mdx-components.tsx`. */
const resolve = (src: string) => (VIDEO.test(src) ? resolveVideoUrl(src) : resolveImageUrl(src));

const resolveSources = (body: string) =>
  body
    .replace(
      /\b(src|beforeSrc|afterSrc)="([^"]+)"/g,
      (_match: string, prop: string, src: string) => `${prop}="${resolve(src)}"`
    )
    .replace(
      /(!\[[^\]]*\]\()([^)]+)\)/g,
      (_match: string, lead: string, src: string) => `${lead}${resolve(src)})`
    );

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
  const body = resolveSources(
    post.content
      .replace(/^export const metadata = \{[\s\S]*?^\};?$/m, '')
      .replace(/^import\s.*$/gm, '')
  );

  return `${frontmatter(post)}\n\n${body.trim()}\n`;
}
