import type { Indices, MediaAnimatedGif, MediaDetails, MediaVideo, Tweet } from 'react-tweet/api';

import { resolveVideoUrl } from '@/lib/cdn';

export const TWEET_EMBED = /<Tweet\b[^>]*?\bid="(\d+)"[^>]*\/>/g;

// Well under Next's 60 s stall limit for a static page, so a silent host falls back.
export const PATIENCE = 10_000;

interface Segment {
  text: string;
  href?: string;
}

const unescape = (text: string) => text.replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');

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

// Bare, X serves 900px whatever the size; `large` is up to 2048.
export const largeUrl = ({ media_url_https }: MediaDetails) => `${media_url_https}?name=large`;

const COUNT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCount = (count: number) => COUNT.format(count);

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
  source: string;
  mirror: string;
}

const isMoving = (medium: MediaDetails): medium is Moving => medium.type !== 'photo';

// The second best encoding, as react-tweet picks: the best is several times the weight.
const playable = (medium: Moving) => {
  const mp4 = medium.video_info.variants
    .filter((variant) => variant.content_type === 'video/mp4')
    .sort((a, b) => (b.bitrate ?? 0) - (a.bitrate ?? 0));
  return (mp4[1] ?? mp4[0])?.url;
};

export const videosOf = (tweet: Pick<Tweet, 'id_str' | 'mediaDetails'>): TweetVideo[] =>
  (tweet.mediaDetails ?? [])
    .filter(isMoving)
    .map((medium, index) => ({
      medium,
      source: playable(medium),
      mirror: resolveVideoUrl(`tweets/${tweet.id_str}-${index}.mp4`),
    }))
    .filter((video): video is TweetVideo => video.source !== undefined);

// A HEAD: the CDN caches a GET's 404 for hours.
export const answers = async (url: string) => {
  try {
    return (await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(PATIENCE) })).ok;
  } catch {
    return false;
  }
};
