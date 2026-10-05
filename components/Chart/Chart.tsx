'use client';

import { useReducedMotion } from 'motion/react';
import { useMemo, useState, type ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import Figure from '@/components/Figure';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import Legend from './Legend';
import { ENTRY_MS, useEntry } from './use-entry';
import { additive, colourOf, combine, toggled } from './series';

import type { ChartProps, Derived, Series } from './types';

/**
 * The derived series is named here but never coloured. `ChartStyle` writes
 * the config's colours into a `<style>` block, and a colour the browser alone
 * can resolve makes that block differ between the server's HTML and the
 * client's, which is a hydration mismatch. It skips an entry with no colour,
 * the mark is handed the resolved one directly, and the tooltip reads it back
 * off the mark.
 */
const configOf = (series: Series[], derived?: Derived): ChartConfig => ({
  ...Object.fromEntries(
    series.map((entry, index) => [entry.key, { label: entry.label, color: colourOf(entry, index) }])
  ),
  ...(derived ? { [derived.key]: { label: derived.label } } : {}),
});

const PLOTS = { area: AreaChart, bar: BarChart, line: LineChart } as const;

/**
 * Each mark is handed the colour to paint rather than deriving
 * `var(--color-<key>)` from its key. The variable is written by `ChartStyle`
 * from the config, which is built once on the server: a colour only the
 * browser can resolve, such as an additive mix, never reached the line.
 */
const MARKS = {
  area: (s: Series, colour: string, animate: boolean) => (
    <Area
      key={s.key}
      dataKey={s.key}
      type="monotone"
      stroke={colour}
      fill={colour}
      fillOpacity={0.2}
      strokeWidth={2}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
  bar: (s: Series, colour: string, animate: boolean) => (
    <Bar
      key={s.key}
      dataKey={s.key}
      fill={colour}
      radius={4}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
  line: (s: Series, colour: string, animate: boolean) => (
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
} as const;

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
  type = 'area',
  caption,
  controls,
  legend = true,
  derived,
  children,
}: ChartProps) {
  const Plot = PLOTS[type];
  const mark = MARKS[type];
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const shown = series.filter(({ key }) => !hidden.has(key));

  // Recomputed from whatever is visible, so switching a channel off changes
  // the answer rather than merely hiding one of its terms.
  // Resolved in the browser, so the first paint falls back to the accent and
  // the mix lands on hydration. The series' own colours are literals here, so
  // nothing but the legend can change it afterwards.
  const derivedColour = useMemo(() => {
    if (derived?.color !== 'additive') return derived?.color;
    return additive(shown.map((entry) => colourOf(entry, series.indexOf(entry))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived?.color, hidden, series]);

  const reduced = useReducedMotion();
  const { ref, drawn, animating } = useEntry(!reduced);
  const combining = shown.length >= (derived?.from ?? 2);
  const labels = Object.fromEntries(
    [...series, ...(derived ? [derived] : [])].map(({ key, label }) => [key, label])
  );
  const plotted = derived
    ? data.map((datum) => ({
        ...datum,
        [derived.key]: combine(
          derived.combine,
          shown.map(({ key }) => Number(datum[key]) || 0),
          derived.max
        ),
      }))
    : data;

  const toggle = (key: string) => setHidden((current) => toggled(current, key, series.length));

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
        <ChartContainer config={configOf(series, derived)}>
          <Plot data={plotted} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
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
              domain={[y?.min ?? 'auto', y?.max ?? 'auto']}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={
                <ChartTooltipContent
                  // Shadcn resolves the heading through the config when the
                  // label is not a string, which on a numeric axis hands back
                  // a series' name. The x value is read off the payload.
                  labelFormatter={(_, items) =>
                    `${items?.[0]?.payload?.[x.key] ?? ''}${x.unit ?? ''}`
                  }
                  // `name` is the data key; the label is what the reader was
                  // shown in the legend.
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">{labels[String(name)] ?? name}</span>
                      <span className="text-foreground ml-auto font-medium tabular-nums">
                        {Math.round(Number(value))}
                        {y?.unit ?? ''}
                      </span>
                    </>
                  )}
                />
              }
            />
            {children}
            {drawn
              ? shown.map((entry) => mark(entry, `var(--color-${entry.key})`, animating))
              : null}
            {/* Last, so it reads over the terms it sums rather than under
                them, which is what makes it legible where they coincide. */}
            {drawn && derived && combining
              ? mark(derived, derivedColour ?? colourOf(derived, series.length), animating)
              : null}
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
function AxisLabel({ children, vertical }: { children: ReactNode; vertical?: boolean }) {
  return (
    <span
      className={cn(
        'text-subtle-foreground block font-mono text-[0.625rem] tracking-[0.12em] uppercase',
        vertical
          ? 'grid shrink-0 place-items-center [writing-mode:vertical-rl] [transform:rotate(180deg)]'
          : 'pt-2 text-center'
      )}
    >
      {children}
    </span>
  );
}
