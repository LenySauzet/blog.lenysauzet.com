'use client';

import type { TooltipContentProps } from 'recharts';

import { glassSurface } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

/**
 * Recharts clones the element it is handed and fills the rest in, so every
 * field it supplies is optional here: written as required, the call site has
 * to invent an `active` and a `payload` it does not have.
 */
export type TooltipProps = Partial<TooltipContentProps<number, string>> & {
  /** Appended to every value, e.g. `%` or `ms`. */
  unit?: string;
  /** Appended to the heading, which is the x value, e.g. `nm`. */
  labelUnit?: string;
};

/**
 * Ours rather than shadcn's `ChartTooltipContent`, for the same reason the
 * legend is: it is a surface of the design system first and a chart part
 * second. It wears the site's glass, marks each series with a disc the size of
 * the legend's, and lays label against value in two columns so the numbers
 * line up down the panel however long the names are.
 *
 * `ChartTooltipContent` marks its series with 2px-radius squares and lets the
 * name push the value along the line, which reads as a debug readout beside
 * the rest of the site.
 */
export default function Tooltip({ active, payload, label, unit = '', labelUnit = '' }: TooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className={cn(glassSurface, 'min-w-36 rounded-xl px-3 py-2.5 shadow-md')}>
      {label == null ? null : (
        <p className="text-foreground border-muted-foreground/15 mb-2 border-b pb-2 font-mono text-xs tracking-wider">
          {label}
          {labelUnit}
        </p>
      )}
      <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-2.5 gap-y-1.5">
        {payload.map((item, index) => (
          // `dataKey` is typed as possibly an accessor function, which is not a
          // key; the order is stable here, the series being a fixed list.
          <div key={index} className="col-span-3 grid grid-cols-subgrid items-center">
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <dt className="text-muted-foreground text-sm">{item.name}</dt>
            <dd className="text-foreground text-sm font-medium tabular-nums">
              {item.value}
              {unit}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
