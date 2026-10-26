'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, {
  Arrow,
  Label,
  Line,
  Magnifier,
  Polygon,
} from '@/components/figures/Diagram';

import { ANGLE, ARROW, coverage, HEIGHT, LENS, SWATCH } from './geometry';

const tile = (share: number) => 0.06 + share * 0.54;

export interface CoverageProps {
  className?: string;
}

export default function Coverage({ className }: CoverageProps) {
  const [degrees, setDegrees] = useState(ANGLE.initial);
  const { cells, edge, focus, source, readout } = coverage(degrees);

  const grid = (
    <>
      {cells.map(({ corners, share }, index) => (
        <Polygon
          key={index}
          corners={corners}
          tone="ink"
          fill={tile(share)}
          width={1.5}
          outline="page"
        />
      ))}
      <Polygon corners={focus.covered} tone="second" fill="hatched" width={0} />
      <Polygon corners={focus.corners} tone="second" width={1.5} />
      <Line from={edge[0]} to={edge[1]} tone="ink" width={2} />
    </>
  );

  return (
    <Figure
      className={className}
      caption="A pixel holds one colour, so an edge that crosses it is averaged. The share of the pixel the shape covers, hatched under the loupe, becomes how strongly the pixel is filled: turn the edge and watch the fill follow.">
      <Diagram height={HEIGHT} title="Coverage anti-aliasing of an edge across a pixel grid">
        {grid}
        <Magnifier source={source} lens={LENS}>
          {grid}
        </Magnifier>
        <Arrow {...ARROW} />
        <Polygon corners={SWATCH} tone="ink" fill={tile(focus.share)} width={1} />
        <Label {...readout}>{`${Math.round(focus.share * 100)}%`}</Label>
      </Diagram>

      <Slider
        label="Edge angle"
        min={ANGLE.min}
        max={ANGLE.max}
        step={0.1}
        defaultValue={ANGLE.initial}
        decimals={1}
        unit="°"
        onValueChange={setDegrees}
      />
    </Figure>
  );
}
