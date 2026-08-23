'use client';

import { useSyncExternalStore } from 'react';

import { Badge } from '@/components/ui/badge';
import { relativeTime } from '@/lib/relative-time';

/** The clock is only ever read, never pushed, so there is nothing to subscribe to. */
const readOnly = () => () => {};

/**
 * Posts are statically generated, so a relative label is only true on the day it was
 * built: months later the markup would still claim the post changed three days ago.
 * The build's value is the server snapshot, which is what the first paint carries and
 * what hydration matches, and the reader's own clock is read from then on.
 */
export function UpdatedBadge({ date, label }: { date: string; label: string }) {
  const current = useSyncExternalStore(
    readOnly,
    () => relativeTime(date),
    () => label
  );

  return (
    <Badge variant="info" asChild className="font-mono font-normal">
      <time dateTime={date}>Updated {current}</time>
    </Badge>
  );
}
