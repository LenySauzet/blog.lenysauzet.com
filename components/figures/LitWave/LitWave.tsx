'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import { Playground, Shader } from '@/components/figures/Shader';

import { FRAGMENT } from './fragment';
import { ASPECT, FREQUENCY, LIGHT, uniforms } from './geometry';

const COLORS = { uInk: '--primary', uShine: '--figure-shine' } as const;

export interface LitWaveProps {
  className?: string;
}

export default function LitWave({ className }: LitWaveProps) {
  const [frequency, setFrequency] = useState(FREQUENCY.initial);
  const [azimuth, setAzimuth] = useState(LIGHT.initial);

  return (
    <Figure
      className={className}
      caption="The same ripple, lit per pixel: each pixel finds where its ray meets the surface and shades it by the light.">
      <Playground
        controls={
          <>
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
              label="Light"
              min={LIGHT.min}
              max={LIGHT.max}
              step={1}
              defaultValue={LIGHT.initial}
              unit="°"
              onValueChange={setAzimuth}
            />
          </>
        }
      >
        <Shader
          fragment={FRAGMENT}
          label="A rippled surface, lit from one side"
          uniforms={uniforms(frequency, azimuth)}
          colors={COLORS}
          aspect={ASPECT}
        />
      </Playground>
    </Figure>
  );
}
