'use client';

import { useEffect } from 'react';

import Anchor from '@/components/prose/Anchor/Anchor';
import { Button } from '@/components/ui/button';

import { StatusPage } from './_components/StatusPage';

export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage status="Error" title="Something went wrong">
      <p>This page failed to load. Trying again usually fixes it.</p>
      <div className="flex items-center gap-6">
        <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
          Home
        </Anchor>
        <Button onClick={retry}>Try again</Button>
      </div>
    </StatusPage>
  );
}
