import { parseISO } from 'date-fns';

/**
 * A calendar day, read as one. `Date.parse` would read `2026-04-22` as midnight UTC
 * and the browser would draw it in the reader's zone, dating every post a day early
 * west of Greenwich. Sorting and RSS stay on plain `Date`: a shared offset cancels.
 */
export const postDate = (date: string) => parseISO(date);
