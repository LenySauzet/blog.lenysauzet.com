'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, { Surface } from '@/components/figures/Diagram';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { AXES, FREQUENCY, HEIGHT, SHAPES, TURN, wave, type Shape } from './geometry';

export interface WaveProps {
  className?: string;
}

export default function Wave({ className }: WaveProps) {
  const [shape, setShape] = useState<Shape>('plane');
  const [frequency, setFrequency] = useState(FREQUENCY.initial);
  const [turn, setTurn] = useState(TURN.initial);
  const { grid, camera } = wave(shape, frequency, turn);

  return (
    <Figure
      className={className}
      caption="A flat grid, every point lifted by a sine of where it sits, which is the whole of what a vertex shader does to it: along one axis for a plane wave, or by its distance from the centre for a ripple. The faces are the page, so whatever lies behind the surface fades, and the heavier line is the silhouette.">
      <Diagram height={HEIGHT} title="A grid displaced by a sine wave">
        <Surface grid={grid} camera={camera} axes={AXES} />
      </Diagram>

      <div className="flex flex-col gap-2">
        <Label htmlFor="wave-shape">Wave</Label>
        <Select value={shape} onValueChange={(next) => setShape(next as Shape)}>
          <SelectTrigger id="wave-shape" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(SHAPES).map((name) => (
              <SelectItem key={name} value={name} className="capitalize">
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
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
