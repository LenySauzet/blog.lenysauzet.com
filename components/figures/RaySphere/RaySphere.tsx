'use client';

import { useMemo, useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, { Circle, Leader, Line, Point } from '@/components/figures/Diagram';
import { add, fromAngle, length, normalize, scale, sub, vec2 } from '@/lib/vec2';

import { rayCircle } from './ray-circle';

const WIDTH = 672;
const HEIGHT = 330;

const ORIGIN = vec2(34, 236);
const CENTRE = vec2(386, 158);
const PLANET = 84;
const ATMOSPHERE = 122;

/** Past the far corner at every angle the slider reaches. */
const RAY_LENGTH = 780;

/** How far a name sits from the dot it belongs to. */
const LABEL_GAP = 21;

export default function RaySphere() {
  const [degrees, setDegrees] = useState(12);

  const geometry = useMemo(() => {
    // Negative: the slider counts upward, and SVG's y axis points down.
    const direction = fromAngle((-degrees * Math.PI) / 180);
    const along = (t: number) => add(ORIGIN, scale(direction, t));
    const hit = rayCircle(ORIGIN, direction, CENTRE, ATMOSPHERE);

    const closest = along(hit.closest);
    // Each name is pushed away from the other rather than to a fixed side. C
    // and H are already separated along this same perpendicular, so opposite
    // fixed offsets bring them back together at whatever angle leaves them
    // twice the offset apart: the sweep found it at 21 degrees. The ray
    // through the centre leaves no direction to push along, so fall back to
    // the perpendicular there.
    const apart = sub(CENTRE, closest);
    const away = length(apart) > 1 ? normalize(apart) : { x: -direction.y, y: direction.x };

    return {
      end: along(RAY_LENGTH),
      closest,
      centreLabel: scale(away, LABEL_GAP),
      closestLabel: scale(away, -LABEL_GAP),
      chord: hit.hits ? ([along(hit.near), along(hit.far)] as const) : null,
      // Near tangency the chord vanishes and p1, p2 and H are one point, so
      // naming H there would claim a distinction the drawing no longer makes.
      namesClosest: hit.hits && hit.far - hit.near > 2 * LABEL_GAP,
    };
  }, [degrees]);

  return (
    <Figure caption="A ray meets a sphere twice, once or never, and which of the three is the sign of the discriminant. The accent marks what the maths found: where the ray crosses, and H, the point on it nearest the centre.">
      <Diagram
        width={WIDTH}
        height={HEIGHT}
        title="A ray crossing a planet's atmosphere"
        description="A ray leaves an origin O and crosses a circle centred on C, entering at p1 and leaving at p2. H marks the point on the ray nearest the centre."
      >
        <Circle at={CENTRE} r={ATMOSPHERE} tone="structure" fill="soft" />
        <Circle at={CENTRE} r={PLANET} tone="structure" fill="solid" />

        <Line from={ORIGIN} to={vec2(CENTRE.x + ATMOSPHERE + 28, ORIGIN.y)} tone="guide" dashed />
        <Line from={ORIGIN} to={geometry.end} tone="structure" width={1.25} />

        {geometry.chord ? (
          <>
            <Line from={CENTRE} to={geometry.closest} tone="guide" dashed />
            <Line from={geometry.chord[0]} to={geometry.chord[1]} tone="subject" width={4} />
            <Point at={geometry.chord[0]} label="p1" />
            <Point at={geometry.chord[1]} label="p2" />
            <Point
              at={geometry.closest}
              label={geometry.namesClosest ? 'H' : undefined}
              r={4}
              offset={geometry.closestLabel}
            />
          </>
        ) : null}

        <Point at={ORIGIN} label="O" tone="structure" />
        <Point at={CENTRE} label="C" tone="structure" offset={geometry.centreLabel} />

        <Leader at={add(CENTRE, vec2(-PLANET * 0.58, PLANET * 0.58))} from={vec2(168, 300)} label="Planet" />
        <Leader at={add(CENTRE, vec2(ATMOSPHERE * 0.74, ATMOSPHERE * 0.74))} from={vec2(560, 306)} label="Atmosphere" />
      </Diagram>

      <Slider
        label="Ray angle"
        min={-24}
        max={36}
        step={0.1}
        defaultValue={12}
        decimals={1}
        unit="°"
        onValueChange={setDegrees}
      />
    </Figure>
  );
}
