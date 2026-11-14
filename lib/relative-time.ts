import { formatDistanceToNowStrict } from 'date-fns'

import { postDate } from './post-date'

// Strict: the loose form rounds a fortnight up to "about 1 month".
export const relativeTime = (date: string) =>
    formatDistanceToNowStrict(postDate(date), { addSuffix: true })
