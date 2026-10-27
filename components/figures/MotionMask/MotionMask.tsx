'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import { Shader } from '@/components/Shader';
import Slider from '@/components/Slider';
import Toggle from '@/components/Toggle';
import { Playback } from '@/components/figures/Playback';
import { Playground } from '@/components/figures/Playground';
import { usePlayback } from '@/hooks/use-playback';

import { FEEDBACK, FRAGMENT } from './fragment';
import { ASPECT, DECAY, INITIAL, TEXTURES, THRESHOLD, uniforms, type Settings } from './settings';

const COLORS = { uInk: '--primary' } as const;

export interface MotionMaskProps {
  className?: string;
}

export default function MotionMask({ className }: MotionMaskProps) {
  const [settings, setSettings] = useState(INITIAL);
  const { playing, toggle } = usePlayback();
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      setSettings((current) => ({ ...current, [key]: value }));

  return (
    <Figure
      className={className}
      caption="A motion mask: each frame compared with the last, what changed past the threshold kept, and fading by the decay.">
      <Playground
        action={<Playback playing={playing} onToggle={toggle} />}
        controls={
          <>
            <Slider
              label="Threshold"
              min={THRESHOLD.min}
              max={THRESHOLD.max}
              step={0.005}
              defaultValue={THRESHOLD.initial}
              decimals={3}
              onValueChange={set('threshold')}
            />
            <Slider
              label="Decay"
              min={DECAY.min}
              max={DECAY.max}
              step={0.01}
              defaultValue={DECAY.initial}
              decimals={2}
              onValueChange={set('decay')}
            />
            <Toggle label="Video" defaultChecked={INITIAL.video} onCheckedChange={set('video')} />
          </>
        }
      >
        <Shader
          fragment={FRAGMENT}
          feedback={FEEDBACK}
          label="Clouds drifting, with what moves between frames traced in the accent colour"
          uniforms={uniforms(settings)}
          colors={COLORS}
          textures={TEXTURES}
          playing={playing}
          aspect={ASPECT}
        />
      </Playground>
    </Figure>
  );
}
