'use client';

import { useReducedMotion } from 'motion/react';
import { Cell, Pie, PieChart as PiePlot } from 'recharts';

import Figure from '@/components/Figure';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

import Legend from './Legend';
import { configOf, resolve } from './series';
import type { PieProps } from './types';
import { ENTRY_MS, useEntry } from './use-entry';

/**
 * Parts of a whole, so it has no axes and shares none of the cartesian chart's
 * shape beyond the frame and the tooltip. Its legend stays a key: switching a
 * slice off changes what the whole is, so the figure would quietly answer a
 * different question than its caption.
 */
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
                // Recharts holds a pie back where every other mark begins at
                // once: `Pie.d.ts` declares `animationBegin: 400`, which showed
                // as 441ms of nothing against a bar's 8.
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
