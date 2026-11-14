'use client';

import { useEffect, useLayoutEffect } from 'react';

import Anchor from '@/components/prose/Anchor/Anchor';
import { Button } from '@/components/ui/button';
import { useHue } from '@/hooks/use-hue';

import { bodyClassName } from './_components/document';
import { StatusPage } from './_components/StatusPage';
import './globals.css';

// next-themes' choice, read by hand: this document replaces the layout that runs it.
const storedTheme = () => {
  try {
    const theme = localStorage.getItem('theme') ?? 'dark';
    if (theme !== 'system') return theme;
  } catch {}
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Rendered on the client after the crash, where an inline script would never run.
  useLayoutEffect(() => {
    document.documentElement.classList.add(storedTheme());
    const { hue, setHue } = useHue.getState();
    setHue(hue);
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={bodyClassName}>
        <title>Something went wrong</title>
        <main className="h-full">
          <StatusPage status="Error" title="Something went wrong">
            <p>The site failed to load. Trying again usually fixes it.</p>
            <div className="flex items-center gap-6">
              <Button onClick={reset}>Try again</Button>
              <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
                Home
              </Anchor>
            </div>
          </StatusPage>
        </main>
      </body>
    </html>
  );
}
