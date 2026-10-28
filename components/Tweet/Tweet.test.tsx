import { render, screen, within } from '@testing-library/react';
import { getTweet, type Tweet as Post } from 'react-tweet/api';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { answers } from '@/lib/tweet';

import photo from './fixtures/photo.json';
import photos from './fixtures/photos.json';
import quoted from './fixtures/quoted.json';
import video from './fixtures/video.json';
import Tweet from './Tweet';

vi.mock('react-tweet/api', () => ({ getTweet: vi.fn() }));

vi.mock('@/lib/tweet', async (original) => ({
  ...(await original<typeof import('@/lib/tweet')>()),
  answers: vi.fn(),
}));

// The real components need the runtime image config and a browser; these tests cover
// what the server decides to hand them.
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
  getImageProps: ({ src }: { src: string }) => ({ props: { src: `/_next/image?url=${encodeURIComponent(src)}` } }),
}));
vi.mock('@/components/Image/ImageZoom', () => ({
  IMAGE_SIZES: '100vw',
  default: ({ src, alt }: { src: string; alt: string }) => <img data-testid="photo" src={src} alt={alt} />,
}));
vi.mock('@/components/VideoPlayer', () => ({
  default: ({ src, poster }: { src: string; poster: string }) => (
    <video data-testid="video" src={src} poster={poster} />
  ),
}));

const fetched = vi.mocked(getTweet);
const copied = vi.mocked(answers);

const show = async (post: unknown, id = '1') => {
  fetched.mockResolvedValue(structuredClone(post) as Post);
  render(await Tweet({ id }));
};

describe('Tweet', () => {
  beforeEach(() => {
    fetched.mockReset();
    copied.mockReset().mockResolvedValue(true);
  });

  it('names its author and links them, the post and its own words', async () => {
    await show(photo);

    expect(screen.getByText('Adam Fuhrer')).toBeInTheDocument();
    expect(screen.getByText('@adamfuhrer').closest('a')).toHaveAttribute('href', 'https://x.com/adamfuhrer');
    expect(screen.getByRole('link', { name: 'View this post on X' })).toHaveAttribute(
      'href',
      'https://x.com/adamfuhrer/status/1772606761695879419',
    );
    expect(screen.getByRole('link', { name: '#plottertwitter' })).toHaveAttribute(
      'href',
      'https://x.com/hashtag/plottertwitter',
    );
  });

  it('drops the link X appends for the media, and asks for the media in its large size', async () => {
    await show(photo);

    expect(screen.queryByText(/t\.co/)).not.toBeInTheDocument();
    expect(screen.getByTestId('photo')).toHaveAttribute('src', expect.stringMatching(/pbs\.twimg\.com\/media\/.*\?name=large$/));
  });

  it('counts its replies and likes, each link saying what it does, and dates itself', async () => {
    await show(photo);

    expect(screen.getByRole('link', { name: 'Reply on X, 1 reply' })).toHaveAttribute(
      'href',
      'https://x.com/intent/tweet?in_reply_to=1772606761695879419',
    );
    expect(screen.getByRole('link', { name: 'Like on X, 165 likes' })).toBeInTheDocument();
    expect(screen.getByText('Mar 26, 2024')).toHaveAttribute('datetime', '2024-03-26T12:49:20.000Z');
  });

  it('asks X for an avatar sharp at twice its size', async () => {
    await show(photo);

    expect(document.querySelector('img[src*="profile_images"]')).toHaveAttribute(
      'src',
      expect.stringContaining('_x96.jpg'),
    );
  });

  it('reads in the language it was written in, and offers the rest of a post X cut', async () => {
    await show({ ...photo, lang: 'fr', note_tweet: { id: '1' } });

    expect(screen.getByText('mona', { exact: false })).toHaveAttribute('lang', 'fr');
    expect(screen.getByRole('link', { name: 'Show more' })).toHaveAttribute(
      'href',
      'https://x.com/adamfuhrer/status/1772606761695879419',
    );
  });

  it('lays several pictures out together, a third across the top', async () => {
    await show(photos);
    expect(screen.getAllByTestId('photo')[0].parentElement).toHaveClass('grid-cols-2');

    const three = structuredClone(photos);
    three.mediaDetails.push({ ...three.mediaDetails[0], media_url_https: 'https://pbs.twimg.com/media/third.jpg' });
    await show(three);
    expect(screen.getAllByTestId('photo').at(-1)!.parentElement).toHaveClass('[&>:first-child]:col-span-2');
  });

  it('plays a video from its copy on the CDN, with a poster asked of this site', async () => {
    await show(video);

    const player = screen.getByTestId('video');
    expect(player).toHaveAttribute('src', expect.stringContaining('/videos/tweets/1995887180514808305-0.mp4'));
    expect(player).toHaveAttribute('poster', expect.stringMatching(/^\/_next\/image\?url=/));
  });

  it('sends the reader to X for a video that was never copied', async () => {
    copied.mockResolvedValue(false);
    await show(video);

    expect(screen.queryByTestId('video')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /to watch on X/ })).toHaveAttribute(
      'href',
      'https://x.com/MaximeHeckel/status/1995887180514808305',
    );
  });

  it('nests the post it quotes, with that post’s own video', async () => {
    await show(quoted);

    const [, inner] = screen.getAllByRole('blockquote');
    expect(within(inner).getByText('@MaximeHeckel')).toBeInTheDocument();
    expect(within(inner).getByText('Jul 13, 2023').closest('a')).toHaveAttribute(
      'href',
      'https://x.com/MaximeHeckel/status/1679319759018418178',
    );
    expect(within(inner).getByTestId('video')).toHaveAttribute(
      'src',
      expect.stringContaining('/videos/tweets/1679319759018418178-0.mp4'),
    );
  });

  it('gives X a deadline, so a silent X reaches the fallback before Next gives up', async () => {
    await show(photo);

    expect(fetched).toHaveBeenCalledWith('1', { signal: expect.any(AbortSignal) });
  });

  it('says it is gone when its author deleted it or made it private', async () => {
    fetched.mockResolvedValue(undefined);
    render(await Tweet({ id: '1' }));

    expect(screen.getByText('This post on X is no longer available.')).toBeInTheDocument();
  });

  it('says the same, and warns, when X cannot be reached', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    fetched.mockRejectedValue(new Error('offline'));
    render(await Tweet({ id: '1' }));

    expect(screen.getByText('This post on X is no longer available.')).toBeInTheDocument();
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
