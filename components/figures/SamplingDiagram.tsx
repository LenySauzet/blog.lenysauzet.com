'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';

export interface SamplingDiagramProps {
  defaultSteps?: number;
  maxSteps?: number;
  caption?: string;
}

const WIDTH = 720;
const HEIGHT = 120;
const INSET = 32;

/**
 * A drawing rather than a chart: there is no data and no axis, only a ray and
 * the places along it that get sampled. Plain SVG, so every colour is a token
 * and the figure rethemes with the site rather than holding a palette.
 *
 * The scale is one subtraction and one multiply, which is all a figure like
 * this ever needs. Reach for a scale library when the mapping stops being
 * linear, not before.
 */
export default function SamplingDiagram({
  defaultSteps = 12,
  maxSteps = 32,
  caption,
}: SamplingDiagramProps) {
  const [steps, setSteps] = useState(defaultSteps);
  const span = WIDTH - INSET * 2;
  const y = HEIGHT / 2;

  return (
    <Figure
      caption={caption}
      controls={
        <Slider
          label="Steps"
          min={2}
          max={maxSteps}
          step={1}
          value={steps}
          onValueChange={setSteps}
        />
      }
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`A ray sampled at ${steps} evenly spaced points`}
      >
        <line
          x1={INSET}
          y1={y}
          x2={WIDTH - INSET}
          y2={y}
          className="stroke-border"
          strokeWidth={2}
        />
        {Array.from({ length: steps }, (_, index) => (
          <circle
            key={index}
            cx={INSET + (span * index) / (steps - 1)}
            cy={y}
            r={6}
            className="fill-primary stroke-background"
            strokeWidth={2}
          />
        ))}
        <text
          x={INSET}
          y={y - 24}
          className="fill-subtle-foreground font-mono text-xs"
          textAnchor="start"
        >
          origin
        </text>
      </svg>
    </Figure>
  );
}
