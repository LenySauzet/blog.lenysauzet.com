'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, { Arrow, Label, Line, Polygon } from '@/components/figures/Diagram';

import { FREQUENCY, HEIGHT, TURN, wave } from './geometry';

export interface WaveProps {
  className?: string;
}

export default function Wave({ className }: WaveProps) {
  const [frequency, setFrequency] = useState(FREQUENCY.initial);
  const [turn, setTurn] = useState(TURN.initial);
  const { pieces, axes } = wave(frequency, turn);

  return (
    <Figure
      className={className}
      caption="A flat grid, every point lifted by a sine of where it sits, which is the whole of what a vertex shader does to it. Each face takes the light by how squarely it meets it, and the heavier line is the silhouette: the border, and every fold where the surface turns away from the eye.">
      <Diagram height={HEIGHT} title="A grid displaced by a sine wave">
        {pieces.map((piece, index) =>
          piece.kind === 'tile' ? (
            <Polygon
              key={index}
              corners={piece.corners}
              tone="ink"
              fill={piece.shade}
              width={0.75}
            />
          ) : (
            <Line key={index} from={piece.from} to={piece.to} tone="ink" width={2} />
          ),
        )}
        {axes.map(({ name, from, to, label }) => (
          <g key={name}>
            <Arrow from={from} to={to} />
            <Label {...label}>{name}</Label>
          </g>
        ))}
      </Diagram>

      <Slider
        label="Frequency"
        min={FREQUENCY.min}
        max={FREQUENCY.max}
        step={0.05}
        defaultValue={FREQUENCY.initial}
        decimals={2}
        onValueChange={setFrequency}
      />
      <Slider
        label="Turn"
        min={TURN.min}
        max={TURN.max}
        step={1}
        defaultValue={TURN.initial}
        unit="°"
        onValueChange={setTurn}
      />
    </Figure>
  );
}
