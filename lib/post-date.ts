import { parseISO } from 'date-fns';

// `Date.parse` reads `2026-04-22` as UTC midnight, a day early west of Greenwich.
export const postDate = (date: string) => parseISO(date);
