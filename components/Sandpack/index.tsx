'use client';

import dynamic from 'next/dynamic';

// Sandpack is a heavy, browser-only dependency: load it lazily and never on the
// server, so only posts that embed a live editor pay for it.
export const Sandpack = dynamic(() => import('./Sandpack').then((mod) => mod.Sandpack), {
  ssr: false,
  loading: () => (
    <div className="not-prose my-6 grid h-[560px] place-items-center rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)] text-sm text-muted-foreground">
      Loading live editor…
    </div>
  ),
});
