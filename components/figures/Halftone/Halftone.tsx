'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Toggle from '@/components/Toggle';
import { Playground, Shader } from '@/components/figures/Shader';

import { ASPECT, CELLS, IMAGE, INITIAL, RADIUS, uniforms, type Settings } from './controls';
import { FRAGMENT } from './fragment';

const TEXTURES = { uImage: IMAGE };

export interface HalftoneProps {
  className?: string;
}

export default function Halftone({ className }: HalftoneProps) {
  const [settings, setSettings] = useState(INITIAL);
  const set =
    <K extends keyof Settings>(key: K) =>
    (value: Settings[K]) =>
      setSettings((current) => ({ ...current, [key]: value }));

  return (
    <Figure
      className={className}
      caption="A halftone: the image sampled once per cell and drawn as a dot, sized by the radius or by the cell's brightness.">
      <Playground
        controls={
          <>
            <Slider
              label="Radius"
              min={RADIUS.min}
              max={RADIUS.max}
              step={0.01}
              defaultValue={RADIUS.initial}
              decimals={2}
              onValueChange={set('radius')}
            />
            <Slider
              label="Cells"
              min={CELLS.min}
              max={CELLS.max}
              step={4}
              defaultValue={CELLS.initial}
              onValueChange={set('cells')}
            />
            <Toggle label="Dots" defaultChecked={INITIAL.dots} onCheckedChange={set('dots')} />
            <Toggle label="Pixelate" defaultChecked={INITIAL.pixelate} onCheckedChange={set('pixelate')} />
            <Toggle label="Size by brightness" onCheckedChange={set('luma')} />
          </>
        }
      >
        <Shader
          fragment={FRAGMENT}
          label="Monet's Meadow with Poplars, drawn as a halftone"
          uniforms={uniforms(settings)}
          textures={TEXTURES}
          aspect={ASPECT}
        />
      </Playground>
    </Figure>
  );
}
