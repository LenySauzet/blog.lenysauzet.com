import * as React from 'react';

import { Table as TablePrimitive } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * A table as an article reads it. The primitive owns structure and appearance;
 * this adds the block rhythm, the surface that holds it, and the one type
 * declaration every cell inherits, so a header is the only thing that has to
 * say anything about itself.
 */
export default function Table({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div className="border-border bg-card my-6 overflow-hidden rounded-xl border">
      <TablePrimitive
        className={cn(
          'font-display text-muted-foreground leading-6',
          // The code block's own surface and edge, and its header is marked the
          // same way: the rule under it and the type on it, not a fill bright
          // enough to read as a second panel.
          '[&_thead]:bg-foreground/[0.03]',
          // A column narrower than this wraps a sentence into a column of
          // single words, so a wide table scrolls inside its own edge instead.
          '[&_td]:min-w-36 [&_th]:min-w-36',
          className
        )}
        {...props}
      />
    </div>
  );
}
