"use client";

import { useReducedMotion } from "motion/react";
import { useId, useState, type ReactNode } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import Figure from "@/components/Figure";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import Legend from "./Legend";
import { ENTRY_MS, useEntry } from "./use-entry";
import { colourOf, toggled } from "./series";

import type { ChartProps, Series } from "./types";

/**
 * Clears the entry animation's leftover dash once it is over. Recharts sets
 * it inline, so the override has to be marked, and **the mark is a trailing
 * `!` on the utility**: `[stroke-dasharray:none!important]` is not a class
 * Tailwind v4 compiles, so it lands in the DOM and generates no rule at all,
 * which looks exactly like a fix that works until the value is measured.
 *
 * It names the series marks rather than every path: the grid and the tooltip
 * cursor are dashed on purpose.
 */
const PAINTED =
  "[&_.recharts-line-curve]:[stroke-dasharray:none]! [&_.recharts-area-area]:[stroke-dasharray:none]! [&_.recharts-area-curve]:[stroke-dasharray:none]!";

const configOf = (series: Series[]): ChartConfig => ({
  ...Object.fromEntries(
    series.map((entry, index) => [
      entry.key,
      { label: entry.label, color: colourOf(entry, index) },
    ]),
  ),
});

const PLOTS = { area: AreaChart, bar: BarChart, line: LineChart } as const;

/**
 * Each mark is handed the colour to paint rather than deriving
 * `var(--color-<key>)` from its key. The variable is written by `ChartStyle`
 * from the config, which is built once on the server: a colour only the
 * browser can resolve would never reach the line.
 */
type Mark = (
  series: Series,
  colour: string,
  animate: boolean,
  fill?: string,
) => ReactNode;

const MARKS: Record<NonNullable<ChartProps["type"]>, Mark> = {
  area: (s, colour, animate, fill = colour) => (
    <Area
      key={s.key}
      dataKey={s.key}
      type="monotone"
      stroke={colour}
      fill={fill}
      fillOpacity={0.4}
      strokeWidth={2}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
  bar: (s, colour, animate) => (
    <Bar
      key={s.key}
      dataKey={s.key}
      fill={colour}
      radius={4}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
  line: (s, colour, animate) => (
    <Line
      key={s.key}
      dataKey={s.key}
      type="monotone"
      stroke={colour}
      strokeWidth={2}
      dot={false}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
};

/**
 * A figure that carries axes. It owns the grid, the tooltip and the legend so
 * every chart on the site reads the same, and takes its colours from the five
 * chart tokens, which derive from `--base-hue` like everything else.
 *
 * `children` are rendered inside the plot, where Recharts' hooks
 * (`useXAxisScale`, `useChartHeight`) let them draw in data coordinates. That
 * is the whole extension story: a decoration shares the axes it decorates
 * rather than standing up a second chart beside them.
 */
export default function Chart({
  data,
  series,
  x,
  y,
  type = "area",
  fill = "gradient",
  caption,
  controls,
  legend = true,
  children,
}: ChartProps) {
  const Plot = PLOTS[type];
  const mark = MARKS[type];
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const shown = series.filter(({ key }) => !hidden.has(key));
  const reduced = useReducedMotion();
  const { ref, drawn, settled } = useEntry(!reduced);
  // Scoped to this chart: a fixed id would be reused by every other chart on
  // the page, and the first one to render would own the fill for all of them.
  const gradients = useId().replace(/:/g, "");
  const fading = type === "area" && fill === "gradient";
  const fillOf = (key: string) =>
    fading ? `url(#${gradients}-${key})` : undefined;

  const labels = Object.fromEntries(
    series.map(({ key, label }) => [key, label]),
  );

  /** Each visible series beside the colour it paints with, which the gradient
      stops and the mark both need. */
  const painted: [Series, string][] = shown.map((entry) => [
    entry,
    `var(--color-${entry.key})`,
  ]);

  const toggle = (key: string) =>
    setHidden((current) => toggled(current, key, series.length));

  return (
    <Figure caption={caption} controls={controls}>
      {legend && series.length > 1 ? (
        // Above the plot, because it is the key to what follows: read after
        // the curves, it explains something already guessed at, and under the
        // plot it competes with the caption for the same job.
        <Legend
          series={series.map((entry, index) => ({
            key: entry.key,
            label: entry.label,
            color: colourOf(entry, index),
          }))}
          hidden={hidden}
          onToggle={toggle}
        />
      ) : null}
      {/* A grid rather than nested boxes: the vertical label then centres on
          the plot's own row instead of on the whole column, which put it a
          legend and an axis label too low. */}
      <div ref={ref} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {y?.label ? <AxisLabel vertical>{y.label}</AxisLabel> : <span />}
        <ChartContainer
          config={configOf(series)}
          className={settled ? PAINTED : undefined}
        >
          <Plot
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            accessibilityLayer
          >
            {fading ? (
              <defs>
                {painted.map(([entry, colour]) => (
                  <linearGradient
                    key={entry.key}
                    id={`${gradients}-${entry.key}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={colour} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colour} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
            ) : null}
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            {/* Recharts labels every datum it has room for, which on a curve
                sampled every few units is a wall of numbers. A gap in pixels
                thins them by how wide they actually are. */}
            <XAxis
              dataKey={x.key}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              minTickGap={40}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={44}
              domain={[y?.min ?? "auto", y?.max ?? "auto"]}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: "3 3" }}
              content={
                <ChartTooltipContent
                  // Shadcn resolves the heading through the config when the
                  // label is not a string, which on a numeric axis hands back
                  // a series' name. The x value is read off the payload.
                  labelFormatter={(_, items) =>
                    `${items?.[0]?.payload?.[x.key] ?? ""}${x.unit ?? ""}`
                  }
                  // `name` is the data key; the label is what the reader was
                  // shown in the legend.
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">
                        {labels[String(name)] ?? name}
                      </span>
                      <span className="text-foreground ml-auto font-medium tabular-nums">
                        {Math.round(Number(value))}
                        {y?.unit ?? ""}
                      </span>
                    </>
                  )}
                />
              }
            />
            {children}
            {drawn
              ? painted.map(([entry, colour]) =>
                  mark(entry, colour, !reduced, fillOf(entry.key)),
                )
              : null}
            {/* Last, so it reads over the terms it sums rather than under
                them, which is what makes it legible where they coincide. */}
          </Plot>
        </ChartContainer>
        <span />
        {x.label ? <AxisLabel>{x.label}</AxisLabel> : null}
      </div>
    </Figure>
  );
}

/**
 * Written by us rather than by `XAxis`'s own `label`, which positions against
 * the plot and lands on top of the tick text at these sizes. Ours is a box in
 * the layout, so it cannot collide, and it carries the figure's typography
 * instead of inheriting the chart's.
 */
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
