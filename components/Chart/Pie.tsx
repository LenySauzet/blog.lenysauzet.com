'use client';

import { useReducedMotion } from 'motion/react';
import { Cell, Pie, PieChart as PiePlot } from 'recharts';

import Figure from '@/components/Figure';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

import Legend from './Legend';
import { configOf, resolve } from './series';
import type { PieProps } from './types';
import { ENTRY_MS, useEntry } from './use-entry';

export default function PieChart({ data, caption, donut = true, legend = true }: PieProps) {
  const animated = !useReducedMotion();
  const { ref, drawn } = useEntry(animated);
  const slices = resolve(data);

  return (
    <Figure caption={caption}>
      {legend ? <Legend series={slices} /> : null}
      <div ref={ref}>
        <ChartContainer config={configOf(slices)}>
          <PiePlot accessibilityLayer>
            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
            {drawn ? (
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius={donut ? '55%' : 0}
                strokeWidth={0}
                isAnimationActive={animated}
                animationDuration={ENTRY_MS}
                animationBegin={0}
              >
                {slices.map(({ key }) => (
                  <Cell key={key} fill={`var(--color-${key})`} />
                ))}
              </Pie>
            ) : null}
          </PiePlot>
        </ChartContainer>
      </div>
    </Figure>
  );
}
