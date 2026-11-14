import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { StatusPage } from './_components/StatusPage';

export const metadata: Metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <StatusPage status="404" title="This page does not exist">
      <p>
        It may have moved, or the link was mistyped. Every article is one search away with{' '}
        <kbd className="rounded-md border border-border px-1.5 py-0.5 font-mono text-xs text-foreground">
          ⌘K
        </kbd>
        .
      </p>
      <Button variant="outline" asChild>
        <Link href="/">
          <HugeiconsIcon icon={ArrowLeft02Icon} data-icon="inline-start" />
          Back home
        </Link>
      </Button>
    </StatusPage>
  );
}
