/** next-themes' choice for a document it does not run in: dark unless told otherwise. */
export const themeOf = (stored: string | null, prefersLight: boolean) =>
  stored === 'light' || (stored === 'system' && prefersLight) ? 'light' : 'dark';
