'use client';

import { useEffect } from 'react';

import Anchor from '@/components/prose/Anchor/Anchor';
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
      <Button onClick={reset}>Try again</Button>
      <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
        Home
      </Anchor>
    </StatusPage>
  );
}
