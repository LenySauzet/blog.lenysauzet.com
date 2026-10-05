'use client';

import { useReducedMotion } from 'motion/react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RadarPlot,
  RadialBar,
  RadialBarChart as RadialPlot,
} from 'recharts';

import Figure from '@/components/Figure';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

import Legend from './Legend';
import { colourOf } from './series';
import type { PolarProps, RadialProps } from './types';
import { ENTRY_MS, useEntry } from './use-entry';

const entriesOf = <T extends { key: string; label: string; color?: string }>(items: T[]) =>
  items.map((item, index) => ({
    key: item.key,
    label: item.label,
    color: colourOf(item, index),
  }));

const configFrom = (entries: { key: string; label: string; color: string }[]) =>
  Object.fromEntries(entries.map(({ key, label, color }) => [key, { label, color }]));

/**
 * One value per series on each of several named axes, which is the only shape
 * a radar says anything about: it compares profiles, so the axes have to be
 * commensurate and few enough to read around the ring.
 */
export function RadarChart({ data, series, axis, caption, legend = true }: PolarProps) {
  const reduced = useReducedMotion();
  const { ref, drawn } = useEntry(!reduced);
  const entries = entriesOf(series);

  return (
    <Figure caption={caption}>
      {legend && series.length > 1 ? <Legend series={entries} /> : null}
      <div ref={ref}>
        <ChartContainer config={configFrom(entries)}>
          <RadarPlot data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={axis} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {drawn
              ? entries.map(({ key }) => (
                  <Radar
                    key={key}
                    dataKey={key}
                    stroke={`var(--color-${key})`}
                    fill={`var(--color-${key})`}
                    fillOpacity={0.25}
                    strokeWidth={2}
                    isAnimationActive={!reduced}
                    animationDuration={ENTRY_MS}
                  />
                ))
              : null}
          </RadarPlot>
        </ChartContainer>
      </div>
    </Figure>
  );
}

/**
 * Arcs of a common track, which reads as a set of gauges rather than as parts
 * of a whole: each row is measured against the same full turn, so unlike a
 * pie they need not sum to anything.
 */
export function RadialChart({ data, caption, legend = true, max = 100 }: RadialProps) {
  const reduced = useReducedMotion();
  const { ref, drawn } = useEntry(!reduced);
  const entries = entriesOf(data);
  const rows = data.map((row, index) => ({
    ...row,
    fill: colourOf(row, index),
  }));

  return (
    <Figure caption={caption}>
      {legend ? <Legend series={entries} /> : null}
      <div ref={ref}>
        <ChartContainer config={configFrom(entries)}>
          <RadialPlot
            data={drawn ? rows : []}
            innerRadius="30%"
            outerRadius="95%"
            startAngle={90}
            endAngle={-270}
          >
            {/* The scale lives on a hidden angle axis, not on the chart: left
                off, every row fills its own ring and the comparison the chart
                exists for disappears. */}
            <PolarAngleAxis type="number" domain={[0, max]} dataKey="value" tick={false} />
            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={8}
              isAnimationActive={!reduced}
              animationDuration={ENTRY_MS}
            />
          </RadialPlot>
        </ChartContainer>
      </div>
    </Figure>
  );
}
