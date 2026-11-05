export const PAGES = {
  search: {
    placeholder: 'Search blog posts...',
    ranksItself: true,
  },
  accent: {
    placeholder: 'Pick an accent...',
    ranksItself: false,
  },
} as const;

export type Page = keyof typeof PAGES;
