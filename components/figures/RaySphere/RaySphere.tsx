'use client';

import { useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, { Circle, Label, Line, Point } from '@/components/figures/Diagram';

import {
  ANGLE,
  ATMOSPHERE,
  CENTRE,
  HEIGHT,
  ORIGIN,
  PLANET,
  raySphere,
} from './geometry';

export default function RaySphere() {
  const [degrees, setDegrees] = useState(ANGLE.initial);
  const { closest, end, crossings, landings, lit, labels } = raySphere(degrees);

  return (
    <Figure caption="A ray meets a sphere twice, once or never, and which of the three is the sign of the discriminant. It crosses the atmosphere at p1 and p2 and the ground at g1 and g2, and the bold stretch is the air it actually travels through, which ends where the planet begins. H is the point nearest the centre, and exists whether or not the ray ever gets there.">
      <Diagram height={HEIGHT} title="A ray crossing a planet's atmosphere">
        <Circle at={CENTRE} r={ATMOSPHERE} tone="ink" fill="soft" />
        <Circle at={CENTRE} r={PLANET} fill="solid" />

        <Line from={ORIGIN} to={CENTRE} tone="guide" dashed />
        <Line from={CENTRE} to={closest} tone="guide" dashed />
        <Line from={ORIGIN} to={end} tone="ink" width={1.5} />
        {lit ? <Line from={lit[0]} to={lit[1]} tone="contrast" width={4} /> : null}

        {landings ? (
          <>
            <Point at={landings[0]} tone="contrast" r={4} />
            <Point at={landings[1]} tone="structure" r={4} />
          </>
        ) : null}
        {crossings ? (
          <>
            <Point at={crossings[0]} tone="contrast" />
            <Point at={crossings[1]} tone="contrast" />
          </>
        ) : null}
        <Point at={closest} r={4} />
        <Point at={ORIGIN} />
        <Point at={CENTRE} />

        {Object.entries(labels).map(([name, placement]) =>
          placement ? (
            <Label key={name} {...placement}>
              {name}
            </Label>
          ) : null,
        )}
      </Diagram>

      <Slider
        label="Ray angle"
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
