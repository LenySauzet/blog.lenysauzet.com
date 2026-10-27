import { PauseIcon, PlayIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { Button } from '@/components/ui/button';

export function Playback({
  playing,
  onToggle,
  className,
}: {
  playing: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={playing ? 'Pause' : 'Play'}
      onClick={onToggle}
      className={className}
    >
      <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} strokeWidth={2} />
    </Button>
  );
}
