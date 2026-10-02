import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';

import { cn } from '@/lib/utils';

const TONES = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
} as const;

interface MarkProps {
  icon: IconSvgElement;
  tone?: keyof typeof TONES;
}

export function Mark({ icon, tone = 'primary' }: MarkProps) {
  return (
    <span
      className={cn(
        'grid size-[1.875rem] shrink-0 place-items-center rounded-full',
        TONES[tone]
      )}
    >
      <HugeiconsIcon icon={icon} strokeWidth={2} className="size-4" />
    </span>
  );
}
