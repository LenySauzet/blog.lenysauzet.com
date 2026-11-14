import type { Metadata } from 'next';

import Anchor from '@/components/prose/Anchor/Anchor';

import { StatusPage } from './_components/StatusPage';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusPage status="404" title="This page does not exist">
      <p>
        It may have moved, or the link that brought you here was mistyped. Every article
        is one search away: open the palette from the island, or with{' '}
        <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-foreground">
          ⌘K
        </kbd>
        .
      </p>
      <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
        Home
      </Anchor>
    </StatusPage>
  );
}
