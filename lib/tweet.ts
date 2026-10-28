import type { Indices, MediaAnimatedGif, MediaDetails, MediaVideo, Tweet } from 'react-tweet/api';

import { resolveVideoUrl } from '@/lib/cdn';

// What this module needs of react-tweet is its data, from `react-tweet/api`. The
// package's root also ships its own theme's stylesheets, which a figure in this site's
// markup has no use for and Node cannot even load.

/** How a post sits in an article, for every reader of the source to agree on. */
export const TWEET_EMBED = /<Tweet\b[^>]*?\bid="(\d+)"[^>]*\/>/g;

// Well under the 60 seconds after which Next restarts a static page that has made no
// progress: a host that accepts the connection and never answers must reach the
// fallback, not take the build down.
export const PATIENCE = 10_000;

interface Segment {
  text: string;
  href?: string;
}

// X sends its text HTML-escaped and counts its indices in the escaped text, so the text
// is cut first and each plain run decoded after.
const unescape = (text: string) => text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');

/**
 * A post's text as runs of plain text and links: hashtags, mentions, cashtags and URLs,
 * each URL shown as X displays it rather than as its t.co redirect. The media's own link
 * at the end is cut, the media being drawn below. Indices count code points, so the
 * text is split with `Array.from`, never by UTF-16 unit.
 */
export function segmentsOf({
  text,
  display_text_range,
  entities,
}: Pick<Tweet, 'text' | 'display_text_range' | 'entities'>) {
  const characters = Array.from(text);
  const media = entities?.media?.[0]?.indices[0] ?? Infinity;
  const [start, end] = [display_text_range[0], Math.min(display_text_range[1], media)];
  const slice = (from: number, to: number) => characters.slice(from, to).join('');

  const links: { indices: Indices; href: string; shown?: string }[] = [
    ...(entities?.hashtags ?? []).map(({ indices, text }) => ({
      indices,
      href: `https://x.com/hashtag/${text}`,
    })),
    ...(entities?.user_mentions ?? []).map(({ indices, screen_name }) => ({
      indices,
      href: `https://x.com/${screen_name}`,
    })),
    ...(entities?.symbols ?? []).map(({ indices, text }) => ({
      indices,
      href: `https://x.com/search?q=%24${text}`,
    })),
    ...(entities?.urls ?? []).map(({ indices, expanded_url, display_url }) => ({
      indices,
      href: expanded_url,
      shown: display_url,
    })),
  ]
    .filter(({ indices: [from, to] }) => from >= start && to <= end)
    .sort((a, b) => a.indices[0] - b.indices[0]);

  const segments: Segment[] = [];
  let at = start;
  for (const link of links) {
    const [from, to] = link.indices;
    if (from < at) continue;
    if (from > at) segments.push({ text: unescape(slice(at, from)) });
    segments.push({ text: link.shown ?? slice(from, to), href: link.href });
    at = to;
  }
  const rest = unescape(slice(at, end)).trimEnd();
  if (rest) segments.push({ text: rest });
  return segments;
}

type Post = Pick<Tweet, 'id_str' | 'user'>;

export const postUrl = ({ id_str, user }: Post) => `https://x.com/${user.screen_name}/status/${id_str}`;
export const replyUrl = ({ id_str }: Post) => `https://x.com/intent/tweet?in_reply_to=${id_str}`;
export const likeUrl = ({ id_str }: Post) => `https://x.com/intent/like?tweet_id=${id_str}`;

// Bare, X serves a picture at 900 pixels whatever its size; `large` is up to 2048.
export const largeUrl = ({ media_url_https }: MediaDetails) => `${media_url_https}?name=large`;

const COUNT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCount = (count: number) => COUNT.format(count);

// UTC, so the date a post shows does not depend on the time zone it was built in.
const DATE = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});
export const formatDate = (date: Date) => DATE.format(date);

type Moving = MediaAnimatedGif | MediaVideo;

export interface TweetVideo {
  medium: Moving;
  /** The file X serves, which X refuses to most sites that link to it. */
  source: string;
  /** The copy on this site's CDN, which is what a reader plays. */
  mirror: string;
}

const isMoving = (medium: MediaDetails): medium is Moving => medium.type !== 'photo';

// The second best of X's encodings, as react-tweet picks it: the best is several times
// the weight for a figure the width of a column. A video X only streams has none, and
// is left to the link to X.
const playable = (medium: Moving) => {
  const mp4 = medium.video_info.variants
    .filter((variant) => variant.content_type === 'video/mp4')
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
  return (mp4[1] ?? mp4[0])?.url;
};

// Keyed by the post and the video's place in it, so the command that copies a video and
// the figure that plays it can never disagree on its name.
export const videosOf = (tweet: Pick<Tweet, 'id_str' | 'mediaDetails'>): TweetVideo[] =>
  (tweet.mediaDetails ?? [])
    .filter(isMoving)
    .map((medium, index) => ({
      medium,
      source: playable(medium),
      mirror: resolveVideoUrl(`tweets/${tweet.id_str}-${index}.mp4`),
    }))
    .filter((video): video is TweetVideo => video.source !== undefined);

// A HEAD, because the CDN caches a GET's 404 for hours: asked before a copy is uploaded,
// it would go on answering missing long after.
export const answers = async (url: string) => {
  try {
    return (await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(PATIENCE) })).ok;
  } catch {
    return false;
  }
};
