'use client';

import { Cell, Pie, PieChart as PiePlot } from 'recharts';

import Figure from '@/components/Figure';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

import Legend from './Legend';
import { colourOf } from './series';
import type { PieProps } from './types';

/**
 * Parts of a whole, so it has no axes and shares none of the cartesian
 * chart's shape beyond the frame and the tooltip.
 */
export default function PieChart({ data, caption, controls, donut = true, legend = true }: PieProps) {
  const entries = data.map((slice, index) => ({
    key: slice.key,
    label: slice.label,
    color: colourOf(slice, index),
  }));
  const config: ChartConfig = Object.fromEntries(
    entries.map(({ key, label, color }) => [key, { label, color }])
  );

  return (
    <Figure caption={caption} controls={controls}>
      {legend ? <Legend series={entries} /> : null}
      <ChartContainer config={config}>
        <PiePlot accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
          <Pie data={data} dataKey="value" nameKey="key" innerRadius={donut ? '55%' : 0} strokeWidth={0}>
            {data.map(({ key }) => (
              <Cell key={key} fill={`var(--color-${key})`} />
            ))}
          </Pie>
        </PiePlot>
      </ChartContainer>
    </Figure>
  );
}
