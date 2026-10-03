/**
 * A palette that has become something else: its own prompt, its own rows. One
 * entry per page, so adding one is a line here rather than a condition spread
 * across the view.
 */
export const PAGES = {
  search: {
    placeholder: 'Search blog posts...',
    /** The page ranks its own rows, so cmdk is told to leave them alone. */
    ranksItself: true,
  },
  accent: {
    placeholder: 'Pick an accent...',
    ranksItself: false,
  },
} as const;

export type Page = keyof typeof PAGES;
