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

const INVERTS_AT = 0.58;

const heat = (ratio: number) =>
  `color-mix(in oklab, var(--heat-to) ${ratio * 100}%, var(--heat-from))`;

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
