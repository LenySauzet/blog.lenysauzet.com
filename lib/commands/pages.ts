/** A palette that has become something else: its own prompt, its own rows. */
export const PAGES = {
  search: {
    placeholder: 'Search blog posts...',
    /** cmdk is told to leave the rows alone, the page ranking its own. */
    ranksItself: true,
  },
  accent: {
    placeholder: 'Pick an accent...',
    ranksItself: false,
  },
} as const;

export type Page = keyof typeof PAGES;
