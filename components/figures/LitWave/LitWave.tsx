'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import { Shader } from '@/components/Shader';
import Slider from '@/components/Slider';
import Toggle from '@/components/Toggle';
import { Playback } from '@/components/figures/Playback';
import { Playground } from '@/components/figures/Playground';
import { usePlayback } from '@/hooks/use-playback';

import { FRAGMENT } from './fragment';
import { ASPECT, FREQUENCY, LIGHT, uniforms } from './geometry';

const COLORS = { uInk: '--primary', uShine: '--figure-shine' } as const;

export interface LitWaveProps {
  className?: string;
}

export default function LitWave({ className }: LitWaveProps) {
  const [frequency, setFrequency] = useState(FREQUENCY.initial);
  const [azimuth, setAzimuth] = useState(LIGHT.initial);
  const [normals, setNormals] = useState(false);
  const { playing, toggle } = usePlayback();

  return (
    <Figure
      className={className}
      caption="The same ripple, lit per pixel: each pixel finds where its ray meets the surface and shades it by the light, or by its normal.">
      <Playground
        action={<Playback playing={playing} onToggle={toggle} />}
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
            <Toggle label="Normals" onCheckedChange={setNormals} />
          </>
        }
      >
        <Shader
          fragment={FRAGMENT}
          label="A rippled surface, lit from one side"
          uniforms={uniforms(frequency, azimuth, normals)}
          colors={COLORS}
          aspect={ASPECT}
          playing={playing}
        />
      </Playground>
    </Figure>
  );
}
