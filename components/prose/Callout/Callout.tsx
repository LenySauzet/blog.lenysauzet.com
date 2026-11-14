import { InformationCircleIcon, SpamIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const VARIANTS = {
  info: { icon: InformationCircleIcon, name: 'Note', accent: '[--callout:var(--primary)]' },
  warning: { icon: SpamIcon, name: 'Warning', accent: '[--callout:var(--warning)]' },
  danger: { icon: SpamIcon, name: 'Caution', accent: '[--callout:var(--destructive)]' },
};

export type CalloutVariant = keyof typeof VARIANTS;

export interface CalloutProps {
  variant?: CalloutVariant;
  /** Replaces the variant's own name in the header. */
  label?: ReactNode;
  className?: string;
  children?: ReactNode;
}

export function Callout({ variant = 'info', label, className, children }: CalloutProps) {
  const { icon, name, accent } = VARIANTS[variant];

  return (
    <aside
      className={cn(
        // my-3 adds to the post's gap rather than collapsing: the parent is a flex column.
        'callout-surface my-3 rounded-xl p-4 [--frame-radius:var(--radius-md)]',
        accent,
        className,
      )}
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-(--callout-ink)">
        <HugeiconsIcon icon={icon} size={16} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        {label ? (
          <>
            {/* The label replaces the name for the eye; a screen reader still hears the variant. */}
            <span className="sr-only">{name}: </span>
            {label}
          </>
        ) : (
          name
        )}
      </div>

      <div className="flex flex-col gap-4 font-display text-base leading-7 text-foreground [&>*]:my-0 [&>p]:text-inherit">
        {children}
      </div>
    </aside>
  );
}
