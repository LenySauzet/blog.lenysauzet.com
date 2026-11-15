'use client';

import { useState } from 'react';

import Slider from '@/components/controls/Slider';
import Toggle from '@/components/controls/Toggle';
import Figure from '@/components/figures/Figure';
import { Playground } from '@/components/figures/Playground';
import { Shader } from '@/components/figures/Shader';

import { FRAGMENT } from './fragment';
import { ASPECT, CELLS, INITIAL, RADIUS, TEXTURES, uniforms, type Settings } from './settings';

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
            <Toggle label="Size by brightness" defaultChecked={INITIAL.luma} onCheckedChange={set('luma')} />
          </>
        }
      >
        <Shader
          fragment={FRAGMENT}
          label="Vermeer's Girl with a Pearl Earring, drawn as a halftone"
          uniforms={uniforms(settings)}
          textures={TEXTURES}
          aspect={ASPECT}
        />
      </Playground>
    </Figure>
  );
}
