'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, {
  Curve,
  Label,
  Leader,
  Line,
  Point,
} from '@/components/figures/Diagram';

import { bezier, HEIGHT, T } from './geometry';

export interface BezierProps {
  className?: string;
}

export default function Bezier({ className }: BezierProps) {
  const [t, setT] = useState(T.initial);
  const { control, first, second, point, drawn, rest, leaders, labels } =
    bezier(t);

  return (
    <Figure
      className={className}
      caption="A cubic Bézier is three rounds of the same move. Each pass slides a point along every segment of the one before, the same fraction t of the way, until a single point is left: that point is on the curve. Sweeping t from 0 to 1 draws the whole of it.">
      <Diagram height={HEIGHT} title="De Casteljau's construction of a cubic Bézier">
        {leaders.map(({ name, target, label }) => (
          <Leader key={name} target={target} label={label}>
            {name}
          </Leader>
        ))}

        <Line from={control[0]} to={control[1]} tone="ink" width={1} />
        <Line from={control[1]} to={control[2]} tone="ink" width={1} />
        <Line from={control[2]} to={control[3]} tone="ink" width={1} />
        <Line from={first[0]} to={first[1]} tone="second" width={1.5} />
        <Line from={first[1]} to={first[2]} tone="second" width={1.5} />
        <Line from={second[0]} to={second[1]} tone="third" width={1.5} />

        <Curve points={rest} tone="ink" width={1.5} dashed />
        <Curve points={drawn} tone="ink" width={3} />

        {control.map((at, index) => (
          <Point key={index} at={at} />
        ))}
        {first.map((at, index) => (
          <Point key={index} at={at} tone="second" r={3.5} />
        ))}
        {second.map((at, index) => (
          <Point key={index} at={at} tone="third" r={3.5} />
        ))}
        <Point at={point} r={6} />

        {Object.entries(labels).map(([name, placement]) => (
          <Label key={name} {...placement}>
            {name}
          </Label>
        ))}
      </Diagram>

      <Slider
        label="t"
        min={T.min}
        max={T.max}
        step={0.01}
        defaultValue={T.initial}
        decimals={2}
        onValueChange={setT}
      />
    </Figure>
  );
}
