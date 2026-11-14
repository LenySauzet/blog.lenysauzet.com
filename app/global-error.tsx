'use client';

import { useEffect, useLayoutEffect } from 'react';

import { paintStoredHue } from '@/hooks/use-hue';
import { themeOf } from '@/lib/theme/stored-theme';

import { bodyClassName } from './_components/document';
import { ErrorBody, type ErrorProps } from './_components/ErrorBody';
import './globals.css';

const storedTheme = () => {
  let stored = null;
  try {
    stored = localStorage.getItem('theme');
  } catch {}
  return themeOf(stored, matchMedia('(prefers-color-scheme: light)').matches);
};

export default function GlobalError({ error, retry }: ErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Rendered on the client after the crash, where an inline script would never run.
  useLayoutEffect(() => {
    const theme = storedTheme();
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    paintStoredHue();
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <title>Something went wrong</title>
        <main className="h-full">
          <ErrorBody what="The site" retry={retry} />
        </main>
      </body>
    </html>
  );
}
