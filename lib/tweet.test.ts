import type { MediaDetails, Tweet } from 'react-tweet/api';
import { afterEach, describe, expect, it, vi } from 'vitest';

import photo from '@/components/Tweet/fixtures/photo.json';
import quoted from '@/components/Tweet/fixtures/quoted.json';
import video from '@/components/Tweet/fixtures/video.json';
import { resolveVideoUrl } from '@/lib/cdn';

import { answers, formatCount, segmentsOf, TWEET_EMBED, videosOf } from './tweet';

describe('the text of a post on X', () => {
  it('links its hashtags and drops the link X appends for its media', () => {
    expect(segmentsOf(photo as unknown as Tweet)).toEqual([
      { text: 'mona ' },
      { text: '#plottertwitter', href: 'https://x.com/hashtag/plottertwitter' },
    ]);
  });

  it('shows a link as X displays it and leads to where it really goes', () => {
    const links = segmentsOf(quoted as unknown as Tweet).filter(({ href }) => href);

    expect(links).toEqual([{ text: 'r3f.maximeheckel.com/sdf7', href: 'http://r3f.maximeheckel.com/sdf7' }]);
  });

  it('stops before the media link even when X counts it as text', () => {
    const post = structuredClone(photo) as unknown as Tweet;
    post.display_text_range = [0, Array.from(post.text).length];

    expect(segmentsOf(post).map(({ text }) => text).join('')).toBe('mona #plottertwitter');
  });

  it('decodes what X escapes, after cutting at indices that count the escaped text', () => {
    const post = {
      text: 'Q&amp;A &lt;3 #x',
      display_text_range: [0, 16],
      entities: { hashtags: [{ indices: [14, 16], text: 'x' }], user_mentions: [], symbols: [], urls: [] },
    } as unknown as Tweet;

    expect(segmentsOf(post)).toEqual([{ text: 'Q&A <3 ' }, { text: '#x', href: 'https://x.com/hashtag/x' }]);
  });

  it('never repeats text when two entities overlap', () => {
    const post = {
      text: '#abc def',
      display_text_range: [0, 8],
      entities: {
        hashtags: [{ indices: [0, 4], text: 'abc' }],
        user_mentions: [],
        symbols: [{ indices: [1, 4], text: 'abc' }],
        urls: [],
      },
    } as unknown as Tweet;

    expect(segmentsOf(post).map(({ text }) => text).join('')).toBe('#abc def');
  });

  it('counts in code points, so an emoji before a link does not shift it', () => {
    const post = {
      text: '🌅 see https://t.co/a',
      display_text_range: [0, 20],
      entities: {
        hashtags: [],
        user_mentions: [],
        symbols: [],
        urls: [{ indices: [6, 20], url: 'https://t.co/a', display_url: 'example.com', expanded_url: 'https://example.com' }],
      },
    } as unknown as Tweet;

    expect(segmentsOf(post)).toEqual([{ text: '🌅 see ' }, { text: 'example.com', href: 'https://example.com' }]);
  });
});

describe('a count', () => {
  it.each([
    [999, '999'],
    [1000, '1K'],
    [1200, '1.2K'],
    [1250, '1.3K'],
    [999_999, '1M'],
    [3_400_000, '3.4M'],
  ])('reads %i as %s', (count, shown) => expect(formatCount(count)).toBe(shown));
});

describe('the videos of a post on X', () => {
  it('names each copy after the post and its place in it', () => {
    const [first] = videosOf(video as unknown as Tweet);

    expect(first.mirror).toBe(resolveVideoUrl('tweets/1995887180514808305-0.mp4'));
  });

  it('copies the second best encoding, the best being several times the weight', () => {
    const [first] = videosOf(video as unknown as Tweet);

    expect(first.source).toContain('474x360');
  });

  it('keeps a quoted post apart from the post quoting it', () => {
    const post = quoted as unknown as Tweet;

    expect(videosOf(post)[0].mirror).toContain('tweets/1686032469244645376-0.mp4');
    expect(videosOf(post.quoted_tweet!)[0].mirror).toContain('tweets/1679319759018418178-0.mp4');
  });

  it('leaves a video X only streams to the link to X, keeping the next one its place', () => {
    const post = structuredClone(video) as unknown as Tweet;
    const streamed = structuredClone(post.mediaDetails![0]) as Extract<MediaDetails, { type: 'video' }>;
    streamed.video_info.variants = streamed.video_info.variants.filter((v) => v.content_type !== 'video/mp4');
    post.mediaDetails = [streamed, ...post.mediaDetails!];

    expect(videosOf(post).map(({ mirror }) => mirror)).toEqual([resolveVideoUrl('tweets/1995887180514808305-1.mp4')]);
  });

  it('leaves a picture alone', () => {
    expect(videosOf(photo as unknown as Tweet)).toEqual([]);
  });
});

describe('whether a copy answers', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks with a HEAD, whose 404 the CDN does not keep', async () => {
    const fetch = vi.fn(async () => new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await answers('https://cdn.example/videos/tweets/1-0.mp4');

    expect(fetch).toHaveBeenCalledWith(expect.any(String), { method: 'HEAD' });
  });

  it.each([
    ['answers', () => Promise.resolve(new Response(null, { status: 200 })), true],
    ['is missing', () => Promise.resolve(new Response(null, { status: 404 })), false],
    ['cannot be reached', () => Promise.reject(new Error('offline')), false],
  ])('says so when the copy %s', async (_, fetch, expected) => {
    vi.stubGlobal('fetch', vi.fn(fetch));

    expect(await answers('https://cdn.example/videos/tweets/1-0.mp4')).toBe(expected);
  });
});

describe('a date', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('is the day in UTC, wherever the build runs', async () => {
    vi.stubEnv('TZ', 'Pacific/Kiritimati');
    vi.resetModules();
    const { formatDate } = await import('./tweet');

    expect(formatDate(new Date('2024-03-26T23:30:00.000Z'))).toBe('Mar 26, 2024');
  });
});

describe('an embedded post', () => {
  it('is found with whatever else the tag carries', () => {
    const source = '<Tweet id="1" />\n<Tweet id="2" className="my-0" />';

    expect([...source.matchAll(TWEET_EMBED)].map((match) => match[1])).toEqual(['1', '2']);
  });
});
