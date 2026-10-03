import type { ReactNode } from 'react';

import Figure from '@/components/Figure';

export interface ConfusionMatrixProps {
  /** Rows are the true class, columns the predicted one. */
  matrix: number[][];
  labels: string[];
  caption?: ReactNode;
  rowLabel?: string;
  columnLabel?: string;
}

/**
 * Tabular data, so a table rather than a drawing: the counts stay selectable,
 * a screen reader reads the headers with each cell, and nothing here needs a
 * client. The tint is the only graphic, and it is a token mixed against the
 * surface rather than a palette of its own.
 *
 * The mix stops well short of the full accent, which is what lets every cell
 * keep the same text colour. Inverting the hottest cells to
 * `--primary-foreground` instead was tried and measured: white on full
 * `--primary` is 3.79:1 in both themes, and 2.16:1 on a half-mixed cell in
 * light mode. Capped, the fill can never climb far enough to fight the body
 * tier, and the scale still reads because the eye compares cells against each
 * other rather than against an absolute.
 */
const DEEPEST_MIX = 45;

export default function ConfusionMatrix({
  matrix,
  labels,
  caption,
  rowLabel = 'Actual',
  columnLabel = 'Predicted',
}: ConfusionMatrixProps) {
  const peak = Math.max(...matrix.flat(), 1);

  return (
    <Figure caption={caption}>
      <table className="w-full border-separate border-spacing-1 text-center font-mono text-sm">
        <caption className="text-subtle-foreground pb-3 text-xs tracking-wider uppercase">
          {columnLabel}
        </caption>
        <thead>
          <tr>
            <td />
            {labels.map((label) => (
              <th key={label} scope="col" className="text-muted-foreground pb-1 text-xs font-normal">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map((row, y) => (
            <tr key={labels[y]}>
              <th
                scope="row"
                className="text-muted-foreground pr-2 text-right text-xs font-normal whitespace-nowrap"
              >
                {labels[y]}
              </th>
              {row.map((count, x) => {
                const ratio = count / peak;
                return (
                  <td
                    key={labels[x]}
                    className="text-foreground rounded-md p-3 tabular-nums"
                    style={{
                      backgroundColor: `color-mix(in oklab, var(--primary) ${ratio * DEEPEST_MIX}%, var(--muted))`,
                    }}
                  >
                    {count}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-subtle-foreground mt-2 text-center text-xs tracking-wider uppercase">
        {rowLabel} down, {columnLabel.toLowerCase()} across
      </p>
    </Figure>
  );
}
