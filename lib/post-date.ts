import { parseISO } from 'date-fns';

/**
 * A post's date is a calendar day, `2026-04-22`: no time, no place. Handed to
 * `Date.parse` that reads as midnight UTC, which the browser then draws in the
 * reader's own zone, so west of Greenwich every post is dated a day early and a post
 * published on a 1 January lands in the previous year's group. `parseISO` reads a
 * date-only string as local midnight instead, so the day shown is the day written.
 *
 * Sorting and the RSS feed stay on plain `Date`: both read every post the same way,
 * so a shared offset cancels, and a feed timestamp is a real instant rather than a
 * calendar day.
 */
export const postDate = (date: string) => parseISO(date);
