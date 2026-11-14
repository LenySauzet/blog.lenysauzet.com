import type { Metadata } from 'next';

import Anchor from '@/components/prose/Anchor/Anchor';

import { StatusPage } from './_components/StatusPage';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusPage status="404" title="This page does not exist">
      <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
        Home
      </Anchor>
      <span className="text-subtle-foreground">
        or search with{' '}
        <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-foreground">
          ⌘K
        </kbd>
      </span>
    </StatusPage>
  );
}
