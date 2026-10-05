'use client';

import { useReducedMotion } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
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
} from 'recharts';

import Figure from '@/components/Figure';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { cn } from '@/lib/utils';

import Legend from './Legend';
import { configOf, resolve, toggled, type Resolved } from './series';
import type { ChartProps } from './types';
import { ENTRY_MS, useEntry } from './use-entry';

const PLOTS = { area: AreaChart, bar: BarChart, line: LineChart } as const;

type Mark = (series: Resolved, animate: boolean, fill?: string) => ReactNode;

/**
 * A mark paints `var(--color-<key>)`, which `ChartStyle` writes from the
 * config, except where it is handed a fill: a gradient is an id this chart
 * made, and only this chart knows it.
 */
const MARKS: Record<NonNullable<ChartProps['type']>, Mark> = {
  area: ({ key }, animate, fill) => (
    <Area
      key={key}
      dataKey={key}
      type="monotone"
      stroke={`var(--color-${key})`}
      fill={fill ?? `var(--color-${key})`}
      fillOpacity={0.4}
      strokeWidth={2}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
  bar: ({ key }, animate) => (
    <Bar
      key={key}
      dataKey={key}
      fill={`var(--color-${key})`}
      radius={4}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
  line: ({ key }, animate) => (
    <Line
      key={key}
      dataKey={key}
      type="monotone"
      stroke={`var(--color-${key})`}
      strokeWidth={2}
      dot={false}
      isAnimationActive={animate}
      animationDuration={ENTRY_MS}
    />
  ),
};

/**
 * The entry animation leaves a `stroke-dasharray` behind, and the mark for
 * this override is a trailing `!`: Tailwind v4 does not compile
 * `[stroke-dasharray:none!important]`, so that class reaches the DOM and
 * generates no rule, which looks exactly like a fix until it is measured. It
 * names the series marks alone, the grid and the cursor being dashed on purpose.
 */
const PAINTED =
  '[&_.recharts-line-curve]:[stroke-dasharray:none]! [&_.recharts-area-area]:[stroke-dasharray:none]! [&_.recharts-area-curve]:[stroke-dasharray:none]!';

/**
 * A figure that carries axes. It owns the grid, the tooltip and the legend so
 * every chart on the site reads the same, and takes its colours from the five
 * chart tokens, which derive from `--base-hue` like everything else.
 *
 * `children` are drawn inside the plot, where Recharts' hooks let them read
 * the scales it already built: a decoration shares the axes it decorates
 * rather than standing up a second chart beside them.
 */
export default function Chart({
  data,
  series,
  x,
  y,
  type = 'area',
  fill = 'gradient',
  caption,
  legend = true,
  children,
}: ChartProps) {
  const Plot = PLOTS[type];
  const mark = MARKS[type];
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const animated = !useReducedMotion();
  const { ref, drawn, settled } = useEntry(animated);
  // An id is document-wide, so a fixed one would hand every chart on the page
  // the first one's fill.
  const scope = useId().replace(/:/g, '');

  const resolved = resolve(series);
  const shown = resolved.filter(({ key }) => !hidden.has(key));
  const gradient = type === 'area' && fill === 'gradient';
  const fillOf = (key: string) => (gradient ? `url(#${scope}-${key})` : undefined);
  const labelOf = (key: string) => resolved.find((entry) => entry.key === key)?.label ?? key;

  return (
    <Figure caption={caption}>
      {legend && series.length > 1 ? (
        <Legend
          series={resolved}
          hidden={hidden}
          onToggle={(key) => setHidden((current) => toggled(current, key, series.length))}
        />
      ) : null}
      {/* A grid rather than nested boxes: the vertical label then centres on
          the plot's own row instead of on the whole column. */}
      <div ref={ref} className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2">
        {y?.label ? <AxisLabel vertical>{y.label}</AxisLabel> : <span />}
        <ChartContainer config={configOf(resolved)} className={settled ? PAINTED : undefined}>
          <Plot data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} accessibilityLayer>
            {gradient ? (
              <defs>
                {shown.map(({ key, color }) => (
                  <linearGradient key={key} id={`${scope}-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>
            ) : null}
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            {/* Recharts labels every datum it has room for, so a densely
                sampled curve gets a wall of numbers. */}
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
                  // Shadcn resolves the heading through the config whenever the
                  // label is not a string, which on a numeric axis hands back a
                  // series' name.
                  labelFormatter={(_, items) =>
                    `${items?.[0]?.payload?.[x.key] ?? ''}${x.unit ?? ''}`
                  }
                  formatter={(value, name) => (
                    <>
                      <span className="text-muted-foreground">{labelOf(String(name))}</span>
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
            {drawn ? shown.map((entry) => mark(entry, animated, fillOf(entry.key))) : null}
          </Plot>
        </ChartContainer>
        {x.label ? <AxisLabel className="col-start-2">{x.label}</AxisLabel> : null}
      </div>
    </Figure>
  );
}

/**
 * `XAxis`'s own `label` positions against the plot and lands on top of the
 * tick text at these sizes. Ours is a box in the layout, so it cannot collide.
 */
function AxisLabel({
  children,
  vertical,
  className,
}: {
  children: ReactNode;
  vertical?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'text-subtle-foreground block font-mono text-[0.625rem] tracking-[0.12em] uppercase',
        vertical
          ? 'grid shrink-0 place-items-center [writing-mode:vertical-rl] [transform:rotate(180deg)]'
          : 'pt-2 text-center',
        className
      )}
    >
      {children}
    </span>
  );
}
