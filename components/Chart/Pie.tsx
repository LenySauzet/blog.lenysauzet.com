"use client";

import { useReducedMotion } from "motion/react";
import { Cell, Pie, PieChart as PiePlot } from "recharts";

import Figure from "@/components/Figure";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

import Legend from "./Legend";
import { ENTRY_MS, useEntry } from "./use-entry";
import { colourOf } from "./series";
import type { PieProps } from "./types";

/**
 * Parts of a whole, so it has no axes and shares none of the cartesian
 * chart's shape beyond the frame and the tooltip.
 */
export default function PieChart({
  data,
  caption,
  controls,
  donut = true,
  legend = true,
}: PieProps) {
  const entries = data.map((slice, index) => ({
    key: slice.key,
    label: slice.label,
    color: colourOf(slice, index),
  }));
  const reduced = useReducedMotion();
  const { ref, drawn } = useEntry(!reduced);
  const config: ChartConfig = Object.fromEntries(
    entries.map(({ key, label, color }) => [key, { label, color }]),
  );

  return (
    <Figure caption={caption} controls={controls}>
      {legend ? <Legend series={entries} /> : null}
      <div ref={ref}>
        <ChartContainer config={config}>
          <PiePlot accessibilityLayer>
            <ChartTooltip
              content={<ChartTooltipContent nameKey="key" hideLabel />}
            />
            {drawn ? (
              <Pie
                data={data}
                dataKey="value"
                nameKey="key"
                innerRadius={donut ? "55%" : 0}
                strokeWidth={0}
                isAnimationActive={!reduced}
                animationDuration={ENTRY_MS}
                // Recharts holds a pie back before it starts, where every other
                // mark begins at once: `Pie.d.ts` declares `animationBegin: 400`
                // against `RadialBar`'s 0. Measured against the others from the
                // same gate, a pie's sectors arrived 441ms after its container
                // where bars took 8 and a line 11, which reads as a stall.
                animationBegin={0}
              >
                {data.map(({ key }) => (
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
