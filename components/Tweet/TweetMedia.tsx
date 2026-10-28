import { PlayIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import NextImage, { getImageProps } from 'next/image';
import type { MediaAnimatedGif, MediaVideo, Tweet } from 'react-tweet/api';

import ImageZoom, { IMAGE_SIZES } from '@/components/Image/ImageZoom';
import VideoPlayer from '@/components/VideoPlayer';
import { largeUrl, videosOf } from '@/lib/tweet';
import { cn } from '@/lib/utils';

// The widest a player gets in the column, which is all a poster needs to fill.
const POSTER_WIDTH = 768;

interface TweetMediaProps {
  tweet: Pick<Tweet, 'id_str' | 'mediaDetails' | 'user'>;
  /** Where a video not copied to the CDN is watched instead. */
  url: string;
  /** The copies the CDN answers for. */
  copied: ReadonlySet<string>;
  className?: string;
}

interface VideoProps {
  medium: MediaAnimatedGif | MediaVideo;
  /** The copy to play, when there is one. */
  mirror?: string;
  url: string;
  author: string;
}

function Video({ medium, mirror, url, author }: VideoProps) {
  const { width, height } = medium.original_info;
  const alt = `A video posted by @${author}`;

  if (!mirror)
    return (
      <a
        href={url}
        style={{ aspectRatio: `${width} / ${height}` }}
        className="group relative flex items-center justify-center overflow-hidden rounded-lg border-2 border-border"
        aria-label={`${alt}, to watch on X`}
      >
        <NextImage src={largeUrl(medium)} alt="" fill sizes={IMAGE_SIZES} className="object-cover" />
        <span className="relative flex items-center gap-2 rounded-full bg-background/80 px-4 py-2 font-display text-sm text-foreground backdrop-blur-sm transition-transform group-hover:scale-105">
          <HugeiconsIcon icon={PlayIcon} size={16} strokeWidth={1.8} />
          Watch on X
        </span>
      </a>
    );

  // Through the optimizer, so even a poster is asked of this site and not of X.
  const poster = getImageProps({
    src: largeUrl(medium),
    alt: '',
    width: POSTER_WIDTH,
    height: Math.round((POSTER_WIDTH * height) / width),
  }).props.src;

  // A GIF on X is a silent looping video, and plays like one.
  const gif = medium.type === 'animated_gif';
  return (
    <VideoPlayer
      src={mirror}
      poster={poster}
      alt={alt}
      width={width}
      height={height}
      muted={gif}
      autoPlay={gif}
      loop={gif}
    />
  );
}

export function TweetMedia({ tweet, url, copied, className }: TweetMediaProps) {
  const media = tweet.mediaDetails ?? [];
  const mirrors = new Map(videosOf(tweet).map(({ medium, mirror }) => [medium, mirror]));
  const author = tweet.user.screen_name;

  return (
    <div
      className={cn(
        'grid gap-2',
        media.length > 1 && 'grid-cols-2',
        // Three in two columns would leave the last alone beside a hole.
        media.length === 3 && '[&>:first-child]:col-span-2',
        className,
      )}
    >
      {media.map((medium) => {
        if (medium.type === 'photo')
          return (
            <ImageZoom
              key={medium.media_url_https}
              src={largeUrl(medium)}
              alt={medium.ext_alt_text || `A picture posted by @${author}`}
              width={medium.original_info.width}
              height={medium.original_info.height}
            />
          );

        const mirror = mirrors.get(medium);
        return (
          <Video
            key={medium.media_url_https}
            medium={medium}
            mirror={mirror && copied.has(mirror) ? mirror : undefined}
            url={url}
            author={author}
          />
        );
      })}
    </div>
  );
}
