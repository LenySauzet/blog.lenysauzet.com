'use client';

import { useState, type ReactNode } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from 'recharts';

import Figure from '@/components/Figure';
import { cn } from '@/lib/utils';
import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';

import Legend from './Legend';
import Tooltip from './Tooltip';
import { colourOf, toggled } from './series';

import type { ChartProps, Series } from './types';

const configOf = (series: Series[]): ChartConfig =>
  Object.fromEntries(
    series.map((entry, index) => [entry.key, { label: entry.label, color: colourOf(entry, index) }])
  );

const PLOTS = { area: AreaChart, bar: BarChart, line: LineChart } as const;

const MARKS = {
  area: (s: Series) => (
    <Area
      key={s.key}
      dataKey={s.key}
      type="monotone"
      stroke={`var(--color-${s.key})`}
      fill={`var(--color-${s.key})`}
      fillOpacity={0.2}
      strokeWidth={2}
    />
  ),
  bar: (s: Series) => <Bar key={s.key} dataKey={s.key} fill={`var(--color-${s.key})`} radius={4} />,
  line: (s: Series) => (
    <Line
      key={s.key}
      dataKey={s.key}
      type="monotone"
      stroke={`var(--color-${s.key})`}
      strokeWidth={2}
      dot={false}
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
  children,
}: ChartProps) {
  const Plot = PLOTS[type];
  const mark = MARKS[type];
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const shown = series.filter(({ key }) => !hidden.has(key));

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
      <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {y?.label ? <AxisLabel vertical>{y.label}</AxisLabel> : <span />}
        <ChartContainer config={configOf(series)} className={TICKS}>
          <Plot data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey={x.key} tickLine={false} axisLine={false} tickMargin={10} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={10}
              width={44}
              domain={[y?.min ?? 'auto', y?.max ?? 'auto']}
            />
            <ChartTooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={<Tooltip unit={y?.unit} labelUnit={x.unit} />}
            />
            {children}
            {shown.map(mark)}
          </Plot>
        </ChartContainer>
        <span />
        {x.label ? <AxisLabel>{x.label}</AxisLabel> : null}
      </div>
    </Figure>
  );
}

/**
 * The tick numbers are the axis labels' own type, which is what makes an axis
 * read as one thing: Departure Mono on the third text tier, not the page's
 * sans on the second. Set here rather than through `XAxis`'s `tick` prop,
 * which takes an object of SVG attributes and cannot name a font variable.
 */
const TICKS =
  '[&_.recharts-cartesian-axis-tick_text]:fill-subtle-foreground [&_.recharts-cartesian-axis-tick_text]:font-mono [&_.recharts-cartesian-axis-tick_text]:text-[0.625rem] [&_.recharts-cartesian-axis-tick_text]:tracking-wider';

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
