/**
 * Copies the videos of every post on X that an article embeds to the CDN, where the
 * Tweet figure plays them: X refuses its video files to most sites that link to them.
 * Only the video is copied; the post itself is still read from X at each build, so one
 * its author deletes leaves every article, video and all.
 *
 *   bun run tweet-videos
 *
 * Uploads with wrangler, which needs `bunx wrangler login` once. Without it, the files
 * are left in a folder and the command says where each one goes.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import { getTweet } from 'react-tweet/api';

import { answers, TWEET_EMBED, videosOf } from '@/lib/tweet';

const BUCKET = 'lenysauzet-assets';

const ids = new Set(
  readdirSync('content')
    .filter((file) => file.endsWith('.mdx'))
    .flatMap((file) =>
      [...readFileSync(join('content', file), 'utf8').matchAll(TWEET_EMBED)].map((match) => match[1]),
    ),
);

const folder = join(tmpdir(), 'tweet-videos');
mkdirSync(folder, { recursive: true });
const failed: string[] = [];
const pending: string[] = [];

async function copy(source: string, mirror: string) {
  const key = new URL(mirror).pathname.slice(1);
  const response = await fetch(source);
  if (!response.ok) throw new Error(`X answered ${response.status} for ${source}`);

  const file = join(folder, basename(key));
  writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  const upload = spawnSync(
    'bunx',
    ['wrangler', 'r2', 'object', 'put', `${BUCKET}/${key}`, '--file', file, '--content-type', 'video/mp4', '--remote'],
    // No stdin: logged out, wrangler then fails rather than waiting on a browser login.
    { stdio: ['ignore', 'inherit', 'inherit'] },
  );
  if (upload.status === 0) console.log(`${key}: copied`);
  else pending.push(`${file} -> ${BUCKET}/${key}`);
}

for (const id of ids) {
  try {
    const tweet = await getTweet(id);
    if (!tweet) {
      console.log(`${id}: no longer on X, nothing to copy`);
      continue;
    }
    for (const post of [tweet, tweet.quoted_tweet].filter((post) => post !== undefined))
      for (const { source, mirror } of videosOf(post)) if (!(await answers(mirror))) await copy(source, mirror);
  } catch (error) {
    failed.push(`${id}: ${error instanceof Error ? error.message : error}`);
  }
}

for (const line of failed) console.error(`Failed, ${line}`);
if (pending.length) {
  console.log('\nNot uploaded. Put each file at its key in R2, or run `bunx wrangler login` and retry:');
  for (const line of pending) console.log(`  ${line}`);
}
if (failed.length || pending.length) process.exitCode = 1;
else console.log('Every embedded video is on the CDN.');
