import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

import { CopyButton } from './CopyButton';
import type { LogLevel } from './read-code';

interface CodeHeaderProps {
  heading: ReactNode;
  // Set when the fence gave its own title, before which a log still says its level.
  titled: boolean;
  level?: LogLevel;
  added: number;
  removed: number;
  getText: () => string;
  className?: string;
}

// Replaces rehype's figcaption, so the copy button sits in the row beside the title.
export function CodeHeader({ heading, titled, level, added, removed, getText, className }: CodeHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 py-2 pr-2 pl-4',
        !level && 'border-b border-[var(--code-border)]',
        className
      )}
    >
      <div className="flex min-w-0 items-baseline gap-3">
        <span
          className={cn(
            'min-w-0 font-display text-sm font-medium wrap-anywhere',
            level ? 'text-[var(--code-ink)]' : 'text-foreground'
          )}
        >
          {titled && level && <span className="sr-only">{level.label}: </span>}
          {heading}
        </span>
        {added + removed > 0 && (
          <span className="shrink-0 font-mono text-xs tabular-nums">
            <span aria-hidden="true">
              <span className="text-[var(--code-added-ink)]">+{added}</span>
              <span className="text-subtle-foreground"> / </span>
              <span className="text-[var(--code-removed-ink)]">−{removed}</span>
            </span>
            <span className="sr-only">
              {[added && `${added} added`, removed && `${removed} removed`].filter(Boolean).join(', ')}
            </span>
          </span>
        )}
      </div>
      <CopyButton
        getText={getText}
        className={cn(
          level &&
            'text-[var(--code-ink)] hover:bg-[var(--code-wash)] hover:text-[var(--code-ink)] focus-visible:bg-[var(--code-wash)] focus-visible:text-[var(--code-ink)]'
        )}
      />
    </div>
  );
}
