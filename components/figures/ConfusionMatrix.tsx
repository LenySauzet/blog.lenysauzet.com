import type { ReactNode } from "react";

import Figure from "@/components/Figure";
import { cn } from "@/lib/utils";

export interface ConfusionMatrixProps {
  /** Rows are the true class, columns the predicted one. */
  matrix: number[][];
  labels: string[];
  caption?: ReactNode;
  rowLabel?: string;
  columnLabel?: string;
}

/**
 * Past this share of the ramp a cell is near `--heat-to`, which is the end
 * that approaches the page's own extreme, so the count flips to
 * `--background`. That one swap is right in both themes because the ramp runs
 * the other way in each: the far end is dark on a light page and bright on a
 * dark one, and `--background` is the opposite of both.
 */
const INVERTS_AT = 0.58;

const heat = (ratio: number) =>
  `color-mix(in oklab, var(--heat-to) ${ratio * 100}%, var(--heat-from))`;

/**
 * A heatmap, which is the form this data is read in everywhere it appears, and
 * still a real `table` underneath: the counts stay selectable and a screen
 * reader reads each with its row and column. The cells sit flush, as a grid
 * rather than as a row of chips, and a bar beside them carries the scale.
 */
export default function ConfusionMatrix({
  matrix,
  labels,
  caption,
  rowLabel = "True",
  columnLabel = "Predicted",
}: ConfusionMatrixProps) {
  const peak = Math.max(...matrix.flat(), 1);
  const floor = Math.min(...matrix.flat(), 0);

  return (
    <Figure caption={caption}>
      {/* Above its own headers, which the browser renders first whatever the
          source order: an axis named at the far end of the grid from the
          labels it names reads as belonging to neither. */}
      <AxisLabel>{columnLabel}</AxisLabel>
      <div className="flex items-stretch gap-3">
        <AxisLabel vertical>{rowLabel}</AxisLabel>
        <table className="min-w-0 flex-1 table-fixed border-separate border-spacing-0 text-center">
          <tbody>
            {matrix.map((row, y) => (
              <tr key={labels[y]}>
                <th
                  scope="row"
                  className="text-subtle-foreground w-px pr-2 text-right font-mono text-[0.625rem] font-normal tracking-wider whitespace-nowrap uppercase"
                >
                  {labels[y]}
                </th>
                {row.map((count, x) => {
                  const ratio = (count - floor) / (peak - floor || 1);
                  return (
                    <td
                      key={labels[x]}
                      className={cn(
                        "p-2 text-sm tabular-nums sm:p-3",
                        ratio > INVERTS_AT
                          ? "text-background"
                          : "text-foreground",
                      )}
                      style={{ backgroundColor: heat(ratio) }}
                    >
                      {count}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <thead>
            <tr>
              <td />
              {labels.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="text-subtle-foreground pb-2 font-mono text-[0.625rem] font-normal tracking-wider uppercase"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <ColourBar from={floor} to={peak} />
      </div>
    </Figure>
  );
}

/**
 * The scale, as the gradient itself rather than as a list of swatches: the
 * reader matches a cell against it by eye, which only works if the bar is
 * continuous.
 */
function ColourBar({ from, to }: { from: number; to: number }) {
  return (
    <div className="flex shrink-0 items-stretch gap-1.5">
      <div
        aria-hidden
        className="w-2.5 rounded-sm"
        style={{
          background: `linear-gradient(to top, var(--heat-from), var(--heat-to))`,
        }}
      />
      <div className="text-subtle-foreground flex flex-col justify-between font-mono text-[0.625rem] tracking-wider tabular-nums">
        <span>{to}</span>
        <span>{from}</span>
      </div>
    </div>
  );
}

function AxisLabel({
  children,
  vertical,
}: {
  children: ReactNode;
  vertical?: boolean;
}) {
  return (
    <span
      className={cn(
        "text-subtle-foreground block font-mono text-[0.625rem] tracking-[0.12em] uppercase",
        vertical
          ? "grid shrink-0 place-items-center [writing-mode:vertical-rl] [transform:rotate(180deg)]"
          : "pt-2 text-center",
      )}
    >
      {children}
    </span>
  );
}
