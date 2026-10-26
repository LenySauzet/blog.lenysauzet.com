'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, {
  Arrow,
  Label,
  Line,
  Point,
  Polygon,
} from '@/components/figures/Diagram';

import { FREQUENCY, HEIGHT, TURN, wave } from './geometry';

export interface WaveProps {
  className?: string;
}

export default function Wave({ className }: WaveProps) {
  const [frequency, setFrequency] = useState(FREQUENCY.initial);
  const [turn, setTurn] = useState(TURN.initial);
  const { pieces, names } = wave(frequency, turn);

  return (
    <Figure
      className={className}
      caption="A flat grid, every point lifted by a sine of where it sits, which is the whole of what a vertex shader does to it. Each face takes the light by how squarely it meets it, and the heavier line is the silhouette: the border, and every fold where the surface turns away from the eye.">
      <Diagram height={HEIGHT} title="A grid displaced by a sine wave">
        {pieces.map((piece) => {
          switch (piece.kind) {
            case 'tile':
              return (
                <Polygon
                  key={piece.id}
                  corners={piece.corners}
                  tone="ink"
                  fill={piece.shade}
                  width={0.75}
                />
              );
            case 'edge':
              return <Line key={piece.id} from={piece.from} to={piece.to} tone="ink" width={2} />;
            case 'vertex':
              return <Point key={piece.id} at={piece.at} r={1.6} />;
            case 'axis':
              return <Line key={piece.id} from={piece.from} to={piece.to} width={1.5} />;
            case 'arrow':
              return <Arrow key={piece.id} from={piece.from} to={piece.to} width={1.5} />;
          }
        })}
        {names.map(({ name, label }) => (
          <Label key={name} {...label}>
            {name}
          </Label>
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
