import { formatDistanceToNowStrict } from 'date-fns'

import { postDate } from './post-date'

/**
 * "3 days ago". Strict, because the loose form rounds a fortnight up to "about 1
 * month" and a post touched last week should not read as older than it is.
 */
export const relativeTime = (date: string) =>
    formatDistanceToNowStrict(postDate(date), { addSuffix: true })
