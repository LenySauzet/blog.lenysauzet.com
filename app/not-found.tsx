import type { Metadata } from 'next';

import Anchor from '@/components/prose/Anchor/Anchor';

import { StatusPage } from './_components/StatusPage';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusPage status="404" title="This page does not exist">
      <p>
        It may have moved, or the link was mistyped. Every article is one search away{' '}
        <span className="pointer-coarse:hidden">
          with{' '}
          <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-foreground">
            ⌘K
          </kbd>
        </span>
        <span className="pointer-fine:hidden">from the island</span>.
      </p>
      <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
        Home
      </Anchor>
    </StatusPage>
  );
}
