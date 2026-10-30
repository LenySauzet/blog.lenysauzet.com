import { ArrowDown01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { glassSurface } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

interface FoldButtonProps {
  expanded: boolean;
  lines: number;
  controls: string;
  onToggle: () => void;
  className?: string;
}

// Floats over the foot of a folded block. Without script it could not unfold
// anything, and globals.css shows such a block whole.
export function FoldButton({ expanded, lines, controls, onToggle, className }: FoldButtonProps) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className={cn(
        glassSurface,
        'absolute bottom-[calc(var(--scrollbar,0px)+0.75rem)] left-1/2 z-10 flex h-8 -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-full px-3.5 font-display text-sm text-muted-foreground shadow-sm transition-[background-color,color,scale] duration-200 outline-none hover:bg-card hover:text-foreground focus-visible:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 motion-safe:hover:scale-[1.03] motion-safe:active:scale-[0.97] print:hidden [@media(scripting:none)]:hidden',
        className
      )}
    >
      {expanded ? 'Show less' : `Show all ${lines} lines`}
      <HugeiconsIcon
        icon={ArrowDown01Icon}
        aria-hidden="true"
        className={cn('size-4 transition-transform motion-reduce:transition-none', expanded && 'rotate-180')}
      />
    </button>
  );
}
