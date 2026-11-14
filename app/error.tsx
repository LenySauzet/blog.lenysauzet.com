'use client';

import { ArrowLeft02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import Link from 'next/link';
import { useEffect } from 'react';

import { Button } from '@/components/ui/button';

import { StatusPage } from './_components/StatusPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage status="Error" title="Something went wrong">
      <p>This page failed to load. Trying again usually fixes it.</p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" asChild>
          <Link href="/">
            <HugeiconsIcon icon={ArrowLeft02Icon} data-icon="inline-start" />
            Back home
          </Link>
        </Button>
      </div>
    </StatusPage>
  );
}
