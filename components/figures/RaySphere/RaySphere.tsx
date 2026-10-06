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
const ORIGIN = vec2(58, 192);
const CENTRE = vec2(430, 192);
const PLANET = 86;
const ATMOSPHERE = 124;

/** Past the far corner at every angle the slider reaches. */
const RAY_LENGTH = 820;
/** How far a name sits from the dot it belongs to. */
const LABEL_GAP = 20;

export default function RaySphere() {
  const [degrees, setDegrees] = useState(9);

  const geometry = useMemo(() => {
    // Negative: the slider counts upward, and SVG's y axis points down.
    const direction = fromAngle((-degrees * Math.PI) / 180);
    const along = (t: number) => add(ORIGIN, scale(direction, t));
    const sky = rayCircle(ORIGIN, direction, CENTRE, ATMOSPHERE);
    const ground = rayCircle(ORIGIN, direction, CENTRE, PLANET);
    const closest = along(sky.closest);

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
      crossings: sky.hits ? ([along(sky.near), along(sky.far)] as const) : null,
      // The planet occludes, so the air a ray actually travels through ends
      // where the ground starts. That truncation is the whole lesson: without
      // it the segment runs clean through a solid body.
      ground: ground.hits ? ([along(ground.near), along(ground.far)] as const) : null,
      lit: sky.hits
        ? ([along(sky.near), along(ground.hits ? ground.near : sky.far)] as const)
        : null,
      // Near tangency the chord vanishes and the crossings are one point, so
      // naming H there claims a distinction the drawing no longer makes.
      namesClosest: !sky.hits || sky.far - sky.near > 2 * LABEL_GAP,
    };
  }, [degrees]);

  return (
    <Figure caption="A ray meets a sphere twice, once or never, and which of the three is the sign of the discriminant. It crosses the atmosphere at p1 and p2 and the ground at g1 and g2, and orange is the air it actually travels through, which ends where the planet begins. H is the point nearest the centre, and exists whether or not the ray ever gets there.">
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

        {geometry.lit ? (
          <Line from={geometry.lit[0]} to={geometry.lit[1]} tone="orange" width={4} />
        ) : null}

        {geometry.ground ? (
          <>
            {/* g1 closes the lit segment, so it belongs to it. g2 is where the
                ray would leave a planet the light never reached. */}
            <Point at={geometry.ground[0]} label="g1" tone="orange" r={4} offset={vec2(0, 18)} />
            <Point at={geometry.ground[1]} label="g2" tone="structure" r={4} offset={vec2(0, 18)} />
          </>
        ) : null}

        {geometry.crossings ? (
          <>
            <Point at={geometry.crossings[0]} label="p1" tone="orange" />
            <Point at={geometry.crossings[1]} label="p2" tone="orange" />
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

        {/* Both reach in from the right and below. The ray leaves upward across
            the whole slider, so a leader from the left crosses it and its
            crossings at most angles. */}
        <Leader at={add(CENTRE, vec2(PLANET * 0.52, PLANET * 0.86))} from={vec2(556, 292)} label="Planet" />
        <Leader at={add(CENTRE, vec2(ATMOSPHERE * 0.66, ATMOSPHERE * 0.75))} from={vec2(528, 348)} label="Atmosphere" />
      </Diagram>

      <Slider
        label="Ray angle"
        min={-22}
        max={22}
        step={0.1}
        defaultValue={9}
        decimals={1}
        unit="°"
        onValueChange={setDegrees}
      />
    </Figure>
  );
}
