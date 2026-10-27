'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import { Shader } from '@/components/Shader';
import Slider from '@/components/Slider';
import { Playback } from '@/components/figures/Playback';
import { Playground } from '@/components/figures/Playground';
import { usePlayback } from '@/hooks/use-playback';

import { FRAGMENT } from './fragment';
import { ASPECT, PIXEL_SIZE, RADIUS, TEXTURES, uniforms } from './settings';

export interface VideoHalftoneProps {
  className?: string;
}

export default function VideoHalftone({ className }: VideoHalftoneProps) {
  const [pixelSize, setPixelSize] = useState(PIXEL_SIZE.initial);
  const [radius, setRadius] = useState(RADIUS.initial);
  const { playing, toggle } = usePlayback();

  return (
    <Figure
      className={className}
      caption="The halftone over a video: each cell takes one colour, and its dot grows as the cell darkens.">
      <Playground
        action={<Playback playing={playing} onToggle={toggle} />}
        controls={
          <>
            <Slider
              label="Pixel size"
              min={PIXEL_SIZE.min}
              max={PIXEL_SIZE.max}
              step={4}
              defaultValue={PIXEL_SIZE.initial}
              unit="px"
              onValueChange={setPixelSize}
            />
            <Slider
              label="Radius"
              min={RADIUS.min}
              max={RADIUS.max}
              step={0.01}
              defaultValue={RADIUS.initial}
              decimals={2}
              onValueChange={setRadius}
            />
          </>
        }
      >
        <Shader
          fragment={FRAGMENT}
          label="Clouds drifting, pixelated, with a white dot in every cell"
          uniforms={uniforms(pixelSize, radius)}
          textures={TEXTURES}
          playing={playing}
          aspect={ASPECT}
        />
      </Playground>
    </Figure>
  );
}
