import * as React from 'react';

import { Table as TablePrimitive } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * A table as an article reads it. The primitive owns structure and appearance;
 * this adds the block rhythm and the one type declaration every cell inherits,
 * so a header is the only thing that has to say anything about itself.
 */
export default function Table({
  className,
  ...props
}: React.ComponentProps<'table'>) {
  return (
    <div className="my-6">
      <TablePrimitive
        className={cn(
          'font-display text-muted-foreground leading-6',
          // The rules already run the width of the column; the cells have to
          // reach it too, or the table reads as indented from the paragraph
          // that introduces it.
          '[&_tr>*:first-child]:ps-0 [&_tr>*:last-child]:pe-0',
          className
        )}
        {...props}
      />
    </div>
  );
}
