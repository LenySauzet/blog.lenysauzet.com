'use client';

import dynamic from 'next/dynamic';

import { EDITOR_HEIGHT } from './constants';

// Heavy and browser-only, so only posts that embed a live editor pay for it.
export const Sandpack = dynamic(() => import('./Sandpack').then((mod) => mod.Sandpack), {
  ssr: false,
  loading: () => (
    <div
      style={{ height: EDITOR_HEIGHT }}
      className="not-prose my-6 grid place-items-center rounded-xl border border-[var(--code-border)] bg-[var(--code-bg)] text-sm text-muted-foreground"
    >
      Loading live editor…
    </div>
  ),
});
