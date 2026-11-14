'use client';

import Anchor from '@/components/prose/Anchor/Anchor';
import { Button } from '@/components/ui/button';

import { StatusPage } from './StatusPage';

export interface ErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export function ErrorBody({ what, retry }: { what: string; retry: () => void }) {
  return (
    <StatusPage status="Error" title="Something went wrong">
      <p>{what} failed to load. Trying again usually fixes it.</p>
      <div className="flex items-center gap-6">
        <Anchor href="/" direction="left" discreet underline={false} favicon={false}>
          Home
        </Anchor>
        <Button onClick={retry}>Try again</Button>
      </div>
    </StatusPage>
  );
}
