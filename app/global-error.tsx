'use client';

import { useEffect, useLayoutEffect } from 'react';

import Anchor from '@/components/prose/Anchor/Anchor';
import { Button } from '@/components/ui/button';
import { useHue } from '@/hooks/use-hue';
import { themeOf } from '@/lib/theme/stored-theme';

import { bodyClassName } from './_components/document';
import { StatusPage } from './_components/StatusPage';
import './globals.css';

const storedTheme = () => {
  let stored = null;
  try {
    stored = localStorage.getItem('theme');
  } catch {}
  return themeOf(stored, matchMedia('(prefers-color-scheme: light)').matches);
};

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
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
              <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
                Home
              </Anchor>
              <Button onClick={retry}>Try again</Button>
            </div>
          </StatusPage>
        </main>
      </body>
    </html>
  );
}
