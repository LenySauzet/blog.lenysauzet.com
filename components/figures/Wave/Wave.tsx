'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, { Surface, Title } from '@/components/figures/Diagram';

import { AXES, FREQUENCY, HEIGHT, TITLE, TURN, wave } from './geometry';

const count = new Intl.NumberFormat('en-US');

export interface WaveProps {
  className?: string;
}

export default function Wave({ className }: WaveProps) {
  const [frequency, setFrequency] = useState(FREQUENCY.initial);
  const [turn, setTurn] = useState(TURN.initial);
  const { grid, camera } = wave(frequency, turn);

  return (
    <Figure
      className={className}
      caption="A flat grid, each point lifted by a wave of its distance from the centre.">
      <Diagram height={HEIGHT} title="A grid displaced by a ripple">
        <Surface grid={grid} camera={camera} axes={AXES} />
        <Title at={TITLE}>{`${count.format(grid.flat().length)} vertices`}</Title>
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
