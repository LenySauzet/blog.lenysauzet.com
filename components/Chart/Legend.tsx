'use client';

import { glassSurface } from '@/components/ui/glass';
import { cn } from '@/lib/utils';

export interface LegendEntry {
  key: string;
  label: string;
  /** Resolved here rather than read as `--color-<key>`: that variable is
      scoped to the chart container, and the legend sits outside it. */
  color: string;
}

export interface LegendProps {
  series: LegendEntry[];
  hidden?: ReadonlySet<string>;
  /**
   * Absent, the legend is a key rather than a control. A pie takes it that
   * way: switching a slice off changes what the whole is, so the figure would
   * answer a different question than the one it is captioned with.
   */
  onToggle?: (key: string) => void;
}

/**
 * Ours rather than Recharts', for three reasons that all turned up at once:
 * its order follows the payload rather than the series as declared, it sits
 * under whatever we put beneath the plot, and a series a reader can switch off
 * is the whole point of a legend on an explanatory chart.
 */
export default function Legend({ series, hidden, onToggle }: LegendProps) {
  return (
    <div
      data-slot="chart-legend"
      className={cn(
        glassSurface,
        'mx-auto mb-4 flex w-fit flex-wrap items-center justify-center gap-0.5 rounded-2xl p-1'
      )}
    >
      {series.map(({ key, label, color }) => {
        const off = hidden?.has(key) ?? false;
        const content = (
          <>
            <span
              aria-hidden
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: off ? 'var(--border)' : color }}
            />
            {label}
          </>
        );
        // The container's radius less its padding, so a row's corner sits
        // concentric with it rather than inside a slightly squarer one.
        const shared = cn(
          'flex items-center gap-2 rounded-xl px-2.5 py-1 text-sm',
          off ? 'text-subtle-foreground' : 'text-foreground'
        );

        return onToggle ? (
          <button
            key={key}
            type="button"
            data-slot="chart-legend-item"
            onClick={() => onToggle(key)}
            aria-pressed={!off}
            className={cn(
              shared,
              'focus-visible:outline-primary cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2'
            )}
          >
            {content}
          </button>
        ) : (
          <span key={key} data-slot="chart-legend-item" className={shared}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
