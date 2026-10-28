import type { Tweet } from 'react-tweet/api';

import Anchor from '@/components/Anchor/Anchor';
import { segmentsOf } from '@/lib/tweet';
import { cn } from '@/lib/utils';

interface TweetTextProps {
  tweet: Pick<Tweet, 'text' | 'display_text_range' | 'entities' | 'lang' | 'note_tweet'>;
  /** Where a post X truncated is read whole. */
  url: string;
  className?: string;
}

export function TweetText({ tweet, url, className }: TweetTextProps) {
  return (
    <p
      lang={tweet.lang}
      dir="auto"
      className={cn('font-display text-base leading-7 whitespace-pre-wrap text-foreground', className)}
    >
      {segmentsOf(tweet).map(({ text, href }, index) =>
        href ? (
          <Anchor key={index} href={href} favicon={false} external={false}>
            {text}
          </Anchor>
        ) : (
          text
        ),
      )}
      {tweet.note_tweet && (
        <>
          {' '}
          <Anchor href={url} favicon={false} external={false}>
            Show more
          </Anchor>
        </>
      )}
    </p>
  );
}
