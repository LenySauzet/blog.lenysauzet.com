'use client';

import type { ReactNode } from 'react';

import Figure from '@/components/Figure';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ConfusionMatrixProps {
  /** Rows are the true class, columns the predicted one. */
  matrix: number[][];
  labels: string[];
  caption?: ReactNode;
  rowLabel?: string;
  columnLabel?: string;
}

/**
 * Past this share of the ramp a cell is near `--heat-to`, the end that
 * approaches the page's own extreme, so the count flips to `--background`.
 * One swap serves both themes because the ramp runs the other way in each.
 */
const INVERTS_AT = 0.58;

const heat = (ratio: number) =>
  `color-mix(in oklab, var(--heat-to) ${ratio * 100}%, var(--heat-from))`;

/**
 * A heatmap, which is the form this data is read in everywhere it appears,
 * and a real `table` underneath: the counts stay selectable and a screen
 * reader reads each with its row and column.
 *
 * **The cells are square and spaced**, not a flush grid: a continuous field
 * reads as an image, where separated tiles read as counts, which is what they
 * are. The square is `aspect-square` on the cell rather than a fixed size, so
 * the matrix fills the column at any order.
 *
 * It is a client component only for the hover readout. Every row of a
 * confusion matrix means "of all the Xs, how many were called Y", and that
 * sentence is what a reader actually wants; the grid alone makes them count
 * along two axes to recover it.
 */
export default function ConfusionMatrix({
  matrix,
  labels,
  caption,
  rowLabel = 'True',
  columnLabel = 'Predicted',
}: ConfusionMatrixProps) {
  const flat = matrix.flat();
  const peak = Math.max(...flat, 1);
  const floor = Math.min(...flat, 0);

  return (
    <Figure caption={caption}>
      <AxisLabel>{columnLabel}</AxisLabel>
      <TooltipProvider delayDuration={120}>
        <div className="flex items-stretch gap-3">
          <AxisLabel vertical>{rowLabel}</AxisLabel>
          <table className="mx-auto w-full max-w-lg table-fixed border-separate border-spacing-1.5 text-center">
            {/* The row labels need a column of their own. Left to shrink to
                nothing they overflowed onto the first cell, `table-fixed`
                giving an unsized column no width at all. */}
            <colgroup>
              <col className="w-[5.5rem]" />
              {labels.map((label) => (
                <col key={label} style={{ width: `${100 / labels.length}%` }} />
              ))}
            </colgroup>
            <tbody>
              {matrix.map((row, y) => {
                const total = row.reduce((a, b) => a + b, 0);
                return (
                  <tr key={labels[y]}>
                    <Label as="th" scope="row" className="pr-2 text-right">
                      {labels[y]}
                    </Label>
                    {row.map((count, x) => {
                      const ratio = (count - floor) / (peak - floor || 1);
                      return (
                        <td key={labels[x]} className="p-0">
                          <Tooltip>
                            <TooltipTrigger
                              className={cn(
                                'flex aspect-square w-full items-center justify-center rounded-md text-sm tabular-nums',
                                // Nothing moves. A tile that grows pushes its
                                // neighbours' edges out of line and the grid
                                // stops reading as a grid; a hairline drawn
                                // inside its own bounds says the same thing
                                // and leaves the field still.
                                'ring-foreground/0 ring-1 transition-[--tw-ring-color] duration-150 ring-inset',
                                'hover:ring-foreground/35 focus-visible:ring-foreground/35',
                                'focus-visible:outline-none motion-reduce:transition-none',
                                ratio > INVERTS_AT ? 'text-background' : 'text-foreground'
                              )}
                              style={{ backgroundColor: heat(ratio) }}
                            >
                              {count}
                            </TooltipTrigger>
                            <TooltipContent>
                              <span className="font-mono">
                                {count} of {total} {labels[y].toLowerCase()} called{' '}
                                {labels[x].toLowerCase()} ({Math.round((count / total) * 100)}%)
                              </span>
                            </TooltipContent>
                          </Tooltip>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
            <thead>
              <tr>
                <td />
                {labels.map((label) => (
                  <Label key={label} as="th" scope="col" className="pb-1.5">
                    {label}
                  </Label>
                ))}
              </tr>
            </thead>
          </table>
          <ColourBar from={floor} to={peak} />
        </div>
      </TooltipProvider>
    </Figure>
  );
}

/**
 * The scale as the gradient itself rather than as a list of swatches: a reader
 * matches a cell against it by eye, which only works if it is continuous.
 */
function ColourBar({ from, to }: { from: number; to: number }) {
  return (
    <div className="flex shrink-0 items-stretch gap-2">
      <div
        aria-hidden
        className="w-2 rounded-full"
        style={{ background: 'linear-gradient(to top, var(--heat-from), var(--heat-to))' }}
      />
      <div className="text-subtle-foreground flex flex-col justify-between font-mono text-[0.625rem] tracking-wider tabular-nums">
        <span>{to}</span>
        <span>{from}</span>
      </div>
    </div>
  );
}

function Label({
  as: Tag,
  children,
  className,
  ...props
}: { as: 'th'; children: ReactNode; className?: string } & React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <Tag
      className={cn(
        'text-subtle-foreground font-mono text-[0.625rem] font-normal tracking-wider whitespace-nowrap uppercase',
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

function AxisLabel({ children, vertical }: { children: ReactNode; vertical?: boolean }) {
  return (
    <span
      className={cn(
        'text-subtle-foreground block font-mono text-[0.625rem] tracking-[0.12em] uppercase',
        vertical
          ? 'grid shrink-0 place-items-center [writing-mode:vertical-rl] [transform:rotate(180deg)]'
          : 'pb-2 text-center'
      )}
    >
      {children}
    </span>
  );
}
