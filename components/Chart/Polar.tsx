"use client";

import { useReducedMotion } from "motion/react";
import { useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RadarPlot,
  RadialBar,
  RadialBarChart as RadialPlot,
} from "recharts";

import Figure from "@/components/Figure";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

import Legend from "./Legend";
import { configOf, resolve, toggled } from "./series";
import type { PolarProps, RadialProps } from "./types";
import { ENTRY_MS, useEntry } from "./use-entry";

export function RadarChart({
  data,
  series,
  axis,
  caption,
  legend = true,
}: PolarProps) {
  const animated = !useReducedMotion();
  const { ref, drawn, settled } = useEntry(animated);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const entries = resolve(series);
  const shown = entries.filter(({ key }) => !hidden.has(key));

  return (
    <Figure caption={caption}>
      {legend && series.length > 1 ? (
        <Legend
          series={entries}
          hidden={hidden}
          onToggle={(key) =>
            setHidden((current) => toggled(current, key, series.length))
          }
        />
      ) : null}
      <div ref={ref}>
        <ChartContainer
          config={configOf(entries)}
          className={
            settled
              ? "[&_.recharts-radar-polygon]:[stroke-dasharray:none]!"
              : undefined
          }
        >
          <RadarPlot data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey={axis} />
            <ChartTooltip content={<ChartTooltipContent />} />
            {drawn
              ? shown.map(({ key }) => (
                  <Radar
                    key={key}
                    dataKey={key}
                    stroke={`var(--color-${key})`}
                    fill={`var(--color-${key})`}
                    fillOpacity={0.25}
                    strokeWidth={2}
                    isAnimationActive={animated}
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

export function RadialChart({
  data,
  caption,
  legend = true,
  max = 100,
}: RadialProps) {
  const animated = !useReducedMotion();
  const { ref, drawn } = useEntry(animated);
  const [hidden, setHidden] = useState<ReadonlySet<string>>(new Set());
  const entries = resolve(data);
  const rows = data
    .map((row, index) => ({ ...row, fill: entries[index].color }))
    .filter(({ key }) => !hidden.has(key));

  return (
    <Figure caption={caption}>
      {legend && data.length > 1 ? (
        <Legend
          series={entries}
          hidden={hidden}
          onToggle={(key) =>
            setHidden((current) => toggled(current, key, data.length))
          }
        />
      ) : null}
      <div ref={ref}>
        <ChartContainer config={configOf(entries)}>
          <RadialPlot
            data={drawn ? rows : []}
            innerRadius="30%"
            outerRadius="95%"
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, max]}
              dataKey="value"
              tick={false}
            />
            <ChartTooltip
              // Recharts' polar cursor fills the whole band, a stray ring.
              cursor={false}
              content={<ChartTooltipContent nameKey="key" hideLabel />}
            />
            <RadialBar
              dataKey="value"
              background
              cornerRadius={8}
              isAnimationActive={animated}
              animationDuration={ENTRY_MS}
            />
          </RadialPlot>
        </ChartContainer>
      </div>
    </Figure>
  );
}
