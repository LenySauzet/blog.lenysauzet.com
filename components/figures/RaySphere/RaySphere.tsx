'use client';

import { useMemo, useState } from 'react';

import Figure from '@/components/Figure';
import Slider from '@/components/Slider';
import Diagram, { Circle, Leader, Line, Point } from '@/components/figures/Diagram';
import { add, length, normalize, scale, sub, vec2, fromAngle } from '@/lib/vec2';

import { rayCircle } from './ray-circle';

const WIDTH = 672;
/* Tall enough to hold H at either end of the slider: it swings the ray's
   length times the sine of the angle, and a frame cut to the resting shape
   drops its name off the edge at the extremes. */
const HEIGHT = 384;

/** O and C share a height, so the axis between them is the figure's horizon. */
const ORIGIN = vec2(44, 192);
const CENTRE = vec2(430, 192);
const PLANET = 86;
const ATMOSPHERE = 124;

/** Past the far corner at every angle the slider reaches. */
const RAY_LENGTH = 820;
/** How far a name sits from the dot it belongs to. */
const LABEL_GAP = 20;

export default function RaySphere() {
  const [degrees, setDegrees] = useState(14);

  const geometry = useMemo(() => {
    // Negative: the slider counts upward, and SVG's y axis points down.
    const direction = fromAngle((-degrees * Math.PI) / 180);
    const along = (t: number) => add(ORIGIN, scale(direction, t));
    const hit = rayCircle(ORIGIN, direction, CENTRE, ATMOSPHERE);
    const closest = along(hit.closest);

    // Each name is pushed away from the other rather than to a fixed side. C and
    // H are already apart along this same perpendicular, so opposite fixed
    // offsets bring them back together at whatever angle leaves them twice the
    // offset apart. A ray through the centre leaves no direction to push along.
    const apart = sub(CENTRE, closest);
    const away =
      length(apart) > 1 ? normalize(apart) : { x: -direction.y, y: direction.x };

    return {
      end: along(RAY_LENGTH),
      closest,
      centreLabel: scale(away, LABEL_GAP),
      closestLabel: scale(away, -LABEL_GAP),
      chord: hit.hits ? ([along(hit.near), along(hit.far)] as const) : null,
      // Near tangency the chord vanishes and p1, p2 and H are one point, so
      // naming H there claims a distinction the drawing no longer makes.
      namesClosest: !hit.hits || hit.far - hit.near > 2 * LABEL_GAP,
    };
  }, [degrees]);

  return (
    <Figure caption="A ray meets a sphere twice, once or never, and which of the three is the sign of the discriminant. Orange marks where it crosses; H is the point on the ray nearest the centre, and exists whether or not it ever gets there.">
      <Diagram
        width={WIDTH}
        height={HEIGHT}
        title="A ray crossing a planet's atmosphere"
        description="A ray leaves an origin O and crosses a circle centred on C, entering at p1 and leaving at p2. H marks the point on the ray nearest the centre."
      >
        <Circle at={CENTRE} r={ATMOSPHERE} tone="blue" fill="soft" />
        <Circle at={CENTRE} r={PLANET} tone="structure" fill="solid" />

        <Line from={ORIGIN} to={CENTRE} tone="guide" dashed />
        <Line from={CENTRE} to={geometry.closest} tone="guide" dashed />
        <Line from={ORIGIN} to={geometry.end} tone="blue" width={1.5} />

        {geometry.chord ? (
          <>
            <Line from={geometry.chord[0]} to={geometry.chord[1]} tone="orange" width={4} />
            <Point at={geometry.chord[0]} label="p1" tone="orange" />
            <Point at={geometry.chord[1]} label="p2" tone="orange" />
          </>
        ) : null}

        <Point
          at={geometry.closest}
          label={geometry.namesClosest ? 'H' : undefined}
          tone="blue"
          r={4}
          offset={geometry.closestLabel}
        />
        <Point at={ORIGIN} label="O" tone="blue" />
        <Point at={CENTRE} label="C" tone="blue" offset={geometry.centreLabel} />

        <Leader at={add(CENTRE, vec2(-PLANET * 0.6, PLANET * 0.6))} from={vec2(168, 338)} label="Planet" />
        <Leader at={add(CENTRE, vec2(ATMOSPHERE * 0.74, ATMOSPHERE * 0.74))} from={vec2(540, 344)} label="Atmosphere" />
      </Diagram>

      <Slider
        label="Ray angle"
        min={-26}
        max={26}
        step={0.1}
        defaultValue={14}
        decimals={1}
        unit="°"
        onValueChange={setDegrees}
      />
    </Figure>
  );
}
