import { ArrowRight02Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type ListVariant = 'ordered' | 'unordered';

interface ListProps {
  variant: ListVariant;
  className?: string;
  children?: ReactNode;
}

// Ordered lists hide the arrow and show a CSS counter instead; the rules key off
// `data-list` in app/globals.css, so nesting needs no depth logic here.
export function List({ variant, className, children }: ListProps) {
  const Tag = variant === 'ordered' ? 'ol' : 'ul';

  return (
    <Tag
      data-list={variant}
      className={cn(
        'my-4 flex flex-col gap-2 font-display text-foreground',
        className
      )}
    >
      {children}
    </Tag>
  );
}

export function ListItem({ children }: { children?: ReactNode }) {
  return (
    <li className="flex items-start gap-3 leading-7">
      <span
        data-list-marker
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-primary"
      >
        <HugeiconsIcon icon={ArrowRight02Icon} size={20} strokeWidth={2} />
      </span>
      <div className="min-w-0">{children}</div>
    </li>
  );
}
