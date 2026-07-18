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

/**
 * The prose list for posts. `variant` maps straight from the MDX tag: `ul` is
 * unordered, `ol` is ordered.
 *
 * Every item renders the same arrow marker (see {@link ListItem}); ordered
 * lists hide it and show a CSS counter instead, entirely in `app/globals.css`.
 * That keeps the two variants one component and — because each nested list is
 * its own `data-list` scope — makes nesting work with no depth logic here: an
 * ordered list inside an unordered one just carries its own counter.
 */
export function List({ variant, className, children }: ListProps) {
  const Tag = variant === 'ordered' ? 'ol' : 'ul';

  return (
    <Tag
      data-list={variant}
      className={cn('my-4 flex flex-col gap-2 font-display text-foreground', className)}
    >
      {children}
    </Tag>
  );
}

/**
 * A single list item: an arrow marker in the brand colour, then the content.
 *
 * The marker is decorative — the list semantics come from the real `ul`/`ol`/`li`
 * elements — so it is `aria-hidden`. In an ordered list a CSS counter takes its
 * place and this arrow is hidden; the `data-list-marker` hook is what those
 * rules target.
 */
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
