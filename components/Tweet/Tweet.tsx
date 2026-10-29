import { Comment01Icon, FavouriteIcon, NewTwitterIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import NextImage from 'next/image';
import { cache } from 'react';
import { getTweet, type QuotedTweet, type Tweet as Post } from 'react-tweet/api';

import { answers, formatCount, formatDate, likeUrl, PATIENCE, postUrl, replyUrl, videosOf } from '@/lib/tweet';
import { cn } from '@/lib/utils';

import { TweetMedia } from './TweetMedia';
import { TweetText } from './TweetText';

const PANEL = 'rounded-frame-xl border border-(--code-border) bg-(--code-bg)';
const QUIET = 'font-display text-sm text-subtle-foreground';

const answering = cache(answers);

export interface TweetProps {
  /** The number at the end of the post's URL. */
  id: string;
  className?: string;
}

// X answers nothing for a post its author deleted or made private, and the article
// follows that choice at the next build rather than keeping what was taken down. X
// failing to answer degrades the same way, so it can never take a deploy down.
async function load(id: string) {
  try {
    return await getTweet(id, { signal: AbortSignal.timeout(PATIENCE) });
  } catch (error) {
    console.warn(`Tweet ${id} could not be fetched, so it is shown as unavailable.`, error);
  }
}

// Asked once, here, so that nothing below waits on the network.
async function copiesOf(post: Post) {
  const videos = [post, post.quoted_tweet].flatMap((each) => (each ? videosOf(each) : []));
  const answered = await Promise.all(videos.map(({ mirror }) => answering(mirror)));
  return new Set(videos.filter((_, index) => answered[index]).map(({ mirror }) => mirror));
}

function Author({ tweet, small }: { tweet: Post | QuotedTweet; small?: boolean }) {
  const { name, screen_name: handle, profile_image_url_https: avatar } = tweet.user;
  const size = small ? 20 : 40;

  return (
    <a
      href={`https://x.com/${handle}`}
      className={cn('flex min-w-0 items-center', small ? 'gap-2' : 'gap-3')}
    >
      <NextImage
        src={avatar.replace('_normal.', '_x96.')}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full"
      />
      <span className={cn('flex min-w-0', small ? 'items-baseline gap-2' : 'flex-col')}>
        <span className="truncate font-display text-sm font-medium text-foreground">{name}</span>
        <span className={cn('truncate', QUIET)}>@{handle}</span>
      </span>
    </a>
  );
}

interface CountProps {
  href: string;
  icon: typeof FavouriteIcon;
  value: number;
  /** What the link does, then what it counts, singular and plural. */
  action: string;
  noun: [string, string];
}

function Count({ href, icon, value, action, noun: [one, many] }: CountProps) {
  return (
    <a
      href={href}
      aria-label={`${action}, ${formatCount(value)} ${value === 1 ? one : many}`}
      className={cn('flex items-center gap-1.5 transition-colors hover:text-foreground', QUIET)}
    >
      <HugeiconsIcon icon={icon} size={18} strokeWidth={1.6} />
      {formatCount(value)}
    </a>
  );
}

function Posted({ date, url }: { date: string; url: string }) {
  const posted = new Date(date);
  return (
    <a href={url} className={cn('transition-colors hover:text-foreground', QUIET)}>
      <time dateTime={posted.toISOString()}>{formatDate(posted)}</time>
    </a>
  );
}

function Quoted({ tweet, copied }: { tweet: QuotedTweet; copied: ReadonlySet<string> }) {
  const url = postUrl(tweet);
  return (
    <blockquote cite={url} className="flex flex-col gap-2 rounded-frame-lg border border-(--code-border) p-3">
      <div className="flex items-baseline justify-between gap-4">
        <Author tweet={tweet} small />
        <Posted date={tweet.created_at} url={url} />
      </div>
      <TweetText tweet={tweet} url={url} className="text-sm leading-6" />
      {tweet.mediaDetails?.length ? <TweetMedia tweet={tweet} url={url} copied={copied} /> : null}
    </blockquote>
  );
}

function Unavailable({ className }: { className?: string }) {
  return (
    <p className={cn('my-6 rounded-frame-xl border border-dashed border-(--code-border) px-4 py-3', QUIET, className)}>
      This post on X is no longer available.
    </p>
  );
}

export default async function Tweet({ id, className }: TweetProps) {
  const tweet = await load(id);
  if (!tweet) return <Unavailable className={className} />;

  const copied = await copiesOf(tweet);
  const url = postUrl(tweet);

  return (
    <figure className={cn('my-6 flex flex-col gap-4 p-4 sm:p-5', PANEL, className)}>
      <figcaption className="flex items-start justify-between gap-4">
        <Author tweet={tweet} />
        <a href={url} aria-label="View this post on X" className="text-subtle-foreground transition-colors hover:text-foreground">
          <HugeiconsIcon icon={NewTwitterIcon} size={20} strokeWidth={1.6} />
        </a>
      </figcaption>

      <blockquote cite={url} className="flex flex-col gap-4">
        <TweetText tweet={tweet} url={url} />
        {tweet.mediaDetails?.length ? <TweetMedia tweet={tweet} url={url} copied={copied} /> : null}
        {tweet.quoted_tweet && <Quoted tweet={tweet.quoted_tweet} copied={copied} />}
      </blockquote>

      <footer className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Count
            href={replyUrl(tweet)}
            icon={Comment01Icon}
            value={tweet.conversation_count}
            action="Reply on X"
            noun={['reply', 'replies']}
          />
          <Count
            href={likeUrl(tweet)}
            icon={FavouriteIcon}
            value={tweet.favorite_count}
            action="Like on X"
            noun={['like', 'likes']}
          />
        </div>
        <Posted date={tweet.created_at} url={url} />
      </footer>
    </figure>
  );
}
